import * as $lex from "./c-lex-0";
import * as $node from "./c-node-0";
import * as $block from "./c-block-0";
import * as $pattern from "../lib/c-pattern-0";
import * as $print from "../lib/c-print-0";
import * as $statement from "./c-statement-0";
import {JsBuilder as J} from "./c-js-builder-0";

export class Expression extends $node.MappableNode {
    static leftToRight() {
        return this.precedence.find(group => group.types.includes(this)).leftToRight;
    }

    static matchPatternCapture(tokenTypes, lexPart, capture) {
        return $pattern.Pattern.matchPatternCapture(tokenTypes, lexPart, this.leftToRight(), capture);
    }

    static searchOne(ruler, lexPart) {
        return $pattern.Pattern.searchOne(ruler, lexPart, this.leftToRight());
    }

    static match(lexPart) {
        let pcs = this.patternsAndCaptures();
        let leftToRight = this.leftToRight();
        return $pattern.Pattern.matchPatternsAndCaptures(pcs, lexPart, leftToRight);
    }

    static build(lexPart) {
        if (lexPart === null) {
            return null;
        }

        let lex = lexPart.lex;
        let startIndex = lexPart.startIndex;
        let endIndex = lexPart.endIndex;

        let r = null;
        if (startIndex === endIndex) {
            let token = lex.at(startIndex);
            if (token instanceof $lex.NormalToken) {
                r = new VariableExpression(lex.at(startIndex).value);
            }
            else if (token instanceof $lex.Num) {
                r = new NumberExpression(lex.at(startIndex).value);
            }
            else if (token instanceof $lex.Str) {
                r = new StringExpression(lex.at(startIndex).value);
            }
            else if (token instanceof $lex.InlineNormalString) {
                r = new InlineNormalStringExpression();
            }
            else if (token instanceof $lex.True) {
                r = new BooleanExpression("true");
            }
            else if (token instanceof $lex.False) {
                r = new BooleanExpression("false");
            }
            else if (token instanceof $lex.Null) {
                r = new NullExpression();
            }
            else if (token instanceof $lex.Void) {
                r = new VoidExpression();
            }
            else if (token instanceof $lex.Arg) {
                r = new ArgExpression();
            }
            else if (token instanceof $lex.Fun) {
                r = new FunExpression();
            }
            else if (token instanceof $lex.Self) {
                r = new SelfExpression();
            }
            else {
                throw new Error("The single token can't be parsed as expression.");
            }
        }
        else if (
            lex.at(startIndex) instanceof $lex.NormalLeftParenthesis &&
            lex.at(endIndex) instanceof $lex.RightParenthesis
        ) {
            r = this.build(lexPart.shrink());
        }
        else {
            for (let i = 0; i < this.precedence.length; i++) {
                let group = this.precedence[i];
                let nearest = null;
                for (let j = 0; j < group.types.length; j++) {
                    let type = group.types[j];
                    let match = type.match(lexPart);
                    if (match !== null) {
                        if (nearest === null) {
                            nearest = {match: match, type: type};
                        }
                        else {
                            if (group.leftToRight) {
                                if (
                                    Math.min(...match.map(m => m.endIndex)) <
                                    Math.min(...nearest.match.map(m => m.endIndex))
                                ) {
                                    nearest = {match: match, type: type};
                                }
                            }
                            else {
                                if (
                                    Math.max(...match.map(m => m.startIndex)) > Math.max(...nearest.match.map(m => m.startIndex))
                                ) {
                                    nearest = {match: match, type: type};
                                }
                            }
                        }
                    }
                }
                if (nearest !== null) {
                    r = nearest.type.applyMatch(nearest.match, lex);
                    break;
                }
            }
            if (r === null) {
                throw new Error("No pattern matches the possible expression.");
            }
        }
        return r.setLexPart(lexPart);
    }

    compile() {
        let rawCompiled = this.rawCompile();
        let jb = null;
        if (Array.isArray(rawCompiled)) {
            jb = new J(rawCompiled);
        }
        else if (typeof rawCompiled === "string") {
            jb = new J(rawCompiled).shareLexPart(this);
        }
        else if (rawCompiled instanceof J) {
            jb = rawCompiled;
        }
        else {
            throw new Error("Compile argument invalid.");
        }
        return new J(["(", jb, ")"]);
    }
}

export class AtomExpression extends Expression {
    constructor(value) {
        super();
        this.value = value;
    }

    toString() {
        return $print.printAtom(this);
    }
}

// Every subclass must have a `sign` static property.
// This class is only for convenience for `a op b` form where both `a` and `b` are expressions.
// It doesn't include all binary expressions.
export class BinaryExpression extends Expression {
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
    }

    static patternsAndCaptures() {
        return [
            [[$pattern.tokens, this.sign, $pattern.tokens], [0, 2]]
        ];
    }

    static applyMatch(match, lex) {
        return new this(
            this.build(lex.part(match[0])),
            this.build(lex.part(match[1]))
        );
    }
}

// Every subclass must have a `sign` static property.
// This class is only for convenience for `op a` form when `a` is an expression.
// It doesn't include all unary expressions.
export class UnaryExpression extends Expression {
    constructor(x) {
        super();
        this.x = x;
    }

    static patternsAndCaptures() {
        return [
            [[this.sign, $pattern.tokens], [1]]
        ];
    }

    static applyMatch(match, lex) {
        return new this(
            this.build(lex.part(match[0]))
        );
    }
}

export class VariableExpression extends AtomExpression {
    rawCompile() {
        return this.value;
    }
}

export class NumberExpression extends AtomExpression {
    rawCompile() {
        return this.value;
    }
}

export class BooleanExpression extends AtomExpression {
    rawCompile() {
        return this.value;
    }
}

export class NullExpression extends AtomExpression {
    rawCompile() {
        return "null";
    }
}

export class VoidExpression extends AtomExpression {
    rawCompile() {
        return "undefined";
    }
}

export class ArgExpression extends AtomExpression {
    rawCompile() {
        if (this.getRoot().hasCompilerDirective("radical")) {
            return "arg_" + $block.antiConflictString + "[0]";
        }
        else {
            return "arg_" + $block.antiConflictString;
        }
    }
}

export class FunExpression extends AtomExpression {
    rawCompile() {
        return "fun_" + $block.antiConflictString;
    }
}

export class SelfExpression extends AtomExpression {}

// This refers to `Str` token.
export class StringExpression extends AtomExpression {
    rawCompile() {
        // Note: If the source code `"aaa"` compiles to JS `"aaa"`, then the left `"` in
        // the compiled JS will map to the first 'a' in source, not to the left `"`
        // in source. This is not a bug, because:
        // If we have interpolation, such as `"aaa\(a)bbb"` that compiles to `"aaa"+a+"bbb"`,
        // then you'll find the source `"` and the compiled `"` are not at the same level,
        // so they are not the same.
        return "\"" + this.value + "\"";
    }
}

// This refers to `InlineNormalString` token.
export class InlineNormalStringExpression extends AtomExpression {}