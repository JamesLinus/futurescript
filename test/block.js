import * as $lex from "../lib/compile-lex-0";
import * as $block from "../lib/compile-block-0";
import assert from "assert";

let s = null;
let lex, result;

lex = new $lex.Lex(`lemo 0.1.0, node module
a: 1 + 2 + 3
b: 2 + 3
c: abc(5, 6)
if a
    c: 7
else
    c: 5
    b: c
d: "xxx"
e: a.b.c
f: 1 + 2 * 3
g: (1 + 2) * 3
h: f + g > Math.PI ? 1 | 2
`);
let block = new $block.RootBlock(lex.part());
console.log(block.print() === `RootBlock [
    AssignStatement {
        assignee: VariableExpression "a"
        value: PlusExpression {
            x: PlusExpression {
                x: NumberExpression "1"
                y: NumberExpression "2"
            }
            y: NumberExpression "3"
        }
    }
    AssignStatement {
        assignee: VariableExpression "b"
        value: PlusExpression {
            x: NumberExpression "2"
            y: NumberExpression "3"
        }
    }
    AssignStatement {
        assignee: VariableExpression "c"
        value: ParenthesisCallExpression {
            callee: VariableExpression "abc"
            arguments: Arr [
                NumberExpression "5"
                NumberExpression "6"
            ]
        }
    }
    ExpressionStatement {
        expression: IfExpression {
            condition: VariableExpression "a"
            thenBranch: Block [
                AssignStatement {
                    assignee: VariableExpression "c"
                    value: NumberExpression "7"
                }
            ]
            elseBranch: Block [
                AssignStatement {
                    assignee: VariableExpression "c"
                    value: NumberExpression "5"
                }
                AssignStatement {
                    assignee: VariableExpression "b"
                    value: VariableExpression "c"
                }
            ]
        }
    }
    AssignStatement {
        assignee: VariableExpression "d"
        value: ParenthesisCallExpression {
            callee: InlineNormalStringExpression
            arguments: Arr [
                StringExpression "xxx"
            ]
        }
    }
    AssignStatement {
        assignee: VariableExpression "e"
        value: DotExpression {
            x: DotExpression {
                x: VariableExpression "a"
                y: Atom "b"
            }
            y: Atom "c"
        }
    }
    AssignStatement {
        assignee: VariableExpression "f"
        value: PlusExpression {
            x: NumberExpression "1"
            y: TimesExpression {
                x: NumberExpression "2"
                y: NumberExpression "3"
            }
        }
    }
    AssignStatement {
        assignee: VariableExpression "g"
        value: TimesExpression {
            x: PlusExpression {
                x: NumberExpression "1"
                y: NumberExpression "2"
            }
            y: NumberExpression "3"
        }
    }
    AssignStatement {
        assignee: VariableExpression "h"
        value: IfExpression {
            condition: GreaterThanExpression {
                x: PlusExpression {
                    x: VariableExpression "f"
                    y: VariableExpression "g"
                }
                y: DotExpression {
                    x: VariableExpression "Math"
                    y: Atom "PI"
                }
            }
            thenBranch: NumberExpression "1"
            elseBranch: NumberExpression "2"
        }
    }
]
`);
