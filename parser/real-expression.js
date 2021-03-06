const parser = /*
 * Generated by PEG.js 0.10.0.
 *
 * http://pegjs.org/
 */
(function() {
  "use strict";

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function peg$SyntaxError(message, expected, found, location) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.location = location;
    this.name     = "SyntaxError";

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, peg$SyntaxError);
    }
  }

  peg$subclass(peg$SyntaxError, Error);

  peg$SyntaxError.buildMessage = function(expected, found) {
    var DESCRIBE_EXPECTATION_FNS = {
          literal: function(expectation) {
            return "\"" + literalEscape(expectation.text) + "\"";
          },

          "class": function(expectation) {
            var escapedParts = "",
                i;

            for (i = 0; i < expectation.parts.length; i++) {
              escapedParts += expectation.parts[i] instanceof Array
                ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
                : classEscape(expectation.parts[i]);
            }

            return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
          },

          any: function(expectation) {
            return "any character";
          },

          end: function(expectation) {
            return "end of input";
          },

          other: function(expectation) {
            return expectation.description;
          }
        };

    function hex(ch) {
      return ch.charCodeAt(0).toString(16).toUpperCase();
    }

    function literalEscape(s) {
      return s
        .replace(/\\/g, '\\\\')
        .replace(/"/g,  '\\"')
        .replace(/\0/g, '\\0')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
    }

    function classEscape(s) {
      return s
        .replace(/\\/g, '\\\\')
        .replace(/\]/g, '\\]')
        .replace(/\^/g, '\\^')
        .replace(/-/g,  '\\-')
        .replace(/\0/g, '\\0')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
    }

    function describeExpectation(expectation) {
      return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
    }

    function describeExpected(expected) {
      var descriptions = new Array(expected.length),
          i, j;

      for (i = 0; i < expected.length; i++) {
        descriptions[i] = describeExpectation(expected[i]);
      }

      descriptions.sort();

      if (descriptions.length > 0) {
        for (i = 1, j = 1; i < descriptions.length; i++) {
          if (descriptions[i - 1] !== descriptions[i]) {
            descriptions[j] = descriptions[i];
            j++;
          }
        }
        descriptions.length = j;
      }

      switch (descriptions.length) {
        case 1:
          return descriptions[0];

        case 2:
          return descriptions[0] + " or " + descriptions[1];

        default:
          return descriptions.slice(0, -1).join(", ")
            + ", or "
            + descriptions[descriptions.length - 1];
      }
    }

    function describeFound(found) {
      return found ? "\"" + literalEscape(found) + "\"" : "end of input";
    }

    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
  };

  function peg$parse(input, options) {
    options = options !== void 0 ? options : {};

    var peg$FAILED = {},

        peg$startRuleIndices = { Expression: 0 },
        peg$startRuleIndex   = 0,

        peg$consts = [
          "+",
          peg$literalExpectation("+", false),
          "-",
          peg$literalExpectation("-", false),
          function(head, tail) {
          		return operatorList(
          			head, tail,
          			function (lhs, operator, rhs, variables) {
          				if (operator === '+') {
          					return lhs + rhs.eval(variables);
          				} else {
          					return lhs - rhs.eval(variables);
          				}
          			}
          		);
          	},
          "*",
          peg$literalExpectation("*", false),
          "/",
          peg$literalExpectation("/", false),
          "%",
          peg$literalExpectation("%", false),
          function(head, tail) {
          		return operatorList(
          			head, tail,
          			function (lhs, operator, rhs, variables) {
          				switch (operator) {
          				case '*': return lhs * rhs.eval(variables);
          				case '/': return lhs / rhs.eval(variables);
          				default: return lhs % rhs.eval(variables);
          				}
          			}
          		);
          	},
          "^",
          peg$literalExpectation("^", false),
          function(base, tail) {
          		return operatorList(
          			base, tail,
          			function (base, operator, power, variables) {
          				return base ** power.eval(variables);
          			}
          		);
          	},
          "(",
          peg$literalExpectation("(", false),
          ")",
          peg$literalExpectation(")", false),
          function(expr) {
          		return expr;
          	},
          "|",
          peg$literalExpectation("|", false),
          function(expr) {
          		return new AbsInvocation(expr);
          	},
          function(multiplier, multiplicand) {
          		if (multiplicand === null) {
          			return multiplier;
          		} else {
          			return new ImplicitMultiply(multiplier, multiplicand);
          		}
          	},
          /^[0-9]/,
          peg$classExpectation([["0", "9"]], false, false),
          ".",
          peg$literalExpectation(".", false),
          function() {
          		return new Constant(parseFloat(text()));
          	},
          "e",
          peg$literalExpectation("e", false),
          function() {
          		return Constant.E;
          	},
          "PI",
          peg$literalExpectation("PI", false),
          function() {
          		return Constant.PI;
          	},
          function(name) {
          		return new Variable(name);
          	},
          function(name, args) {
          		return new FunctionInvocation(name, args);
          	},
          /^[a-zA-Z]/,
          peg$classExpectation([["a", "z"], ["A", "Z"]], false, false),
          /^[a-zA-Z0-9]/,
          peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"]], false, false),
          function() { return text(); },
          ",",
          peg$literalExpectation(",", false),
          function(head, tail) {
          		return [head].concat(tail.map(function (element) {
          			return element[3];
          		}));
          	},
          "",
          function() { return []; },
          peg$otherExpectation("whitespace"),
          /^[ \t\n\r]/,
          peg$classExpectation([" ", "\t", "\n", "\r"], false, false)
        ],

        peg$bytecode = [
          peg$decode("%;!/\xA7#$%;*/P#2 \"\"6 7!.) &2\"\"\"6\"7#/5$;*/,$;!/#$+$)($'#(#'#(\"'#&'#0Z*%;*/P#2 \"\"6 7!.) &2\"\"\"6\"7#/5$;*/,$;!/#$+$)($'#(#'#(\"'#&'#&/)$8\":$\"\"! )(\"'#&'#"),
          peg$decode("%;\"/\xBF#$%;*/\\#2%\"\"6%7&.5 &2'\"\"6'7(.) &2)\"\"6)7*/5$;*/,$;\"/#$+$)($'#(#'#(\"'#&'#0f*%;*/\\#2%\"\"6%7&.5 &2'\"\"6'7(.) &2)\"\"6)7*/5$;*/,$;\"/#$+$)($'#(#'#(\"'#&'#&/)$8\":+\"\"! )(\"'#&'#"),
          peg$decode("%;#/\x8F#$%;*/D#2,\"\"6,7-/5$;*/,$;#/#$+$)($'#(#'#(\"'#&'#0N*%;*/D#2,\"\"6,7-/5$;*/,$;#/#$+$)($'#(#'#(\"'#&'#&/)$8\":.\"\"! )(\"'#&'#"),
          peg$decode("%2/\"\"6/70/R#;*/I$; /@$;*/7$21\"\"6172/($8%:3%!\")(%'#($'#(#'#(\"'#&'#.\x98 &%24\"\"6475/R#;*/I$; /@$;*/7$24\"\"6475/($8%:6%!\")(%'#($'#(#'#(\"'#&'#.S &;'.M &%;$/7#;#.\" &\"/)$8\":7\"\"! )(\"'#&'#.) &;%.# &;&"),
          peg$decode("%;*/\x97#2\"\"\"6\"7#.\" &\"/\x83$$48\"\"5!79/,#0)*48\"\"5!79&&&#/a$%2:\"\"6:7;/?#$48\"\"5!790)*48\"\"5!79&/#$+\")(\"'#&'#.\" &\"/'$8$:<$ )($'#(#'#(\"'#&'#"),
          peg$decode("%2=\"\"6=7>/& 8!:?! ).4 &%2@\"\"6@7A/& 8!:B! )"),
          peg$decode("%;*/:#;(/1$;*/($8#:C#!!)(#'#(\"'#&'#"),
          peg$decode("%;*/t#;(/k$;*/b$2/\"\"6/70/S$;*/J$;)/A$;*/8$21\"\"6172/)$8(:D(\"&\")(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;*/R#4E\"\"5!7F/C$$4G\"\"5!7H0)*4G\"\"5!7H&/'$8#:I# )(#'#(\"'#&'#"),
          peg$decode("%; /\x8F#$%;*/D#2J\"\"6J7K/5$;*/,$; /#$+$)($'#(#'#(\"'#&'#0N*%;*/D#2J\"\"6J7K/5$;*/,$; /#$+$)($'#(#'#(\"'#&'#&/)$8\":L\"\"! )(\"'#&'#.. &% M/& 8!:N! )"),
          peg$decode("<$4P\"\"5!7Q0)*4P\"\"5!7Q&=.\" 7O")
        ],

        peg$currPos          = 0,
        peg$savedPos         = 0,
        peg$posDetailsCache  = [{ line: 1, column: 1 }],
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleIndices)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleIndex = peg$startRuleIndices[options.startRule];
    }

    function text() {
      return input.substring(peg$savedPos, peg$currPos);
    }

    function location() {
      return peg$computeLocation(peg$savedPos, peg$currPos);
    }

    function expected(description, location) {
      location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

      throw peg$buildStructuredError(
        [peg$otherExpectation(description)],
        input.substring(peg$savedPos, peg$currPos),
        location
      );
    }

    function error(message, location) {
      location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

      throw peg$buildSimpleError(message, location);
    }

    function peg$literalExpectation(text, ignoreCase) {
      return { type: "literal", text: text, ignoreCase: ignoreCase };
    }

    function peg$classExpectation(parts, inverted, ignoreCase) {
      return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
    }

    function peg$anyExpectation() {
      return { type: "any" };
    }

    function peg$endExpectation() {
      return { type: "end" };
    }

    function peg$otherExpectation(description) {
      return { type: "other", description: description };
    }

    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos], p;

      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!peg$posDetailsCache[p]) {
          p--;
        }

        details = peg$posDetailsCache[p];
        details = {
          line:   details.line,
          column: details.column
        };

        while (p < pos) {
          if (input.charCodeAt(p) === 10) {
            details.line++;
            details.column = 1;
          } else {
            details.column++;
          }

          p++;
        }

        peg$posDetailsCache[pos] = details;
        return details;
      }
    }

    function peg$computeLocation(startPos, endPos) {
      var startPosDetails = peg$computePosDetails(startPos),
          endPosDetails   = peg$computePosDetails(endPos);

      return {
        start: {
          offset: startPos,
          line:   startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line:   endPosDetails.line,
          column: endPosDetails.column
        }
      };
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildSimpleError(message, location) {
      return new peg$SyntaxError(message, null, null, location);
    }

    function peg$buildStructuredError(expected, found, location) {
      return new peg$SyntaxError(
        peg$SyntaxError.buildMessage(expected, found),
        expected,
        found,
        location
      );
    }

    function peg$decode(s) {
      var bc = new Array(s.length), i;

      for (i = 0; i < s.length; i++) {
        bc[i] = s.charCodeAt(i) - 32;
      }

      return bc;
    }

    function peg$parseRule(index) {
      var bc    = peg$bytecode[index],
          ip    = 0,
          ips   = [],
          end   = bc.length,
          ends  = [],
          stack = [],
          params, i;

      while (true) {
        while (ip < end) {
          switch (bc[ip]) {
            case 0:
              stack.push(peg$consts[bc[ip + 1]]);
              ip += 2;
              break;

            case 1:
              stack.push(void 0);
              ip++;
              break;

            case 2:
              stack.push(null);
              ip++;
              break;

            case 3:
              stack.push(peg$FAILED);
              ip++;
              break;

            case 4:
              stack.push([]);
              ip++;
              break;

            case 5:
              stack.push(peg$currPos);
              ip++;
              break;

            case 6:
              stack.pop();
              ip++;
              break;

            case 7:
              peg$currPos = stack.pop();
              ip++;
              break;

            case 8:
              stack.length -= bc[ip + 1];
              ip += 2;
              break;

            case 9:
              stack.splice(-2, 1);
              ip++;
              break;

            case 10:
              stack[stack.length - 2].push(stack.pop());
              ip++;
              break;

            case 11:
              stack.push(stack.splice(stack.length - bc[ip + 1], bc[ip + 1]));
              ip += 2;
              break;

            case 12:
              stack.push(input.substring(stack.pop(), peg$currPos));
              ip++;
              break;

            case 13:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1]) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 14:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1] === peg$FAILED) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 15:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1] !== peg$FAILED) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 16:
              if (stack[stack.length - 1] !== peg$FAILED) {
                ends.push(end);
                ips.push(ip);

                end = ip + 2 + bc[ip + 1];
                ip += 2;
              } else {
                ip += 2 + bc[ip + 1];
              }

              break;

            case 17:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (input.length > peg$currPos) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 18:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (input.substr(peg$currPos, peg$consts[bc[ip + 1]].length) === peg$consts[bc[ip + 1]]) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 19:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (input.substr(peg$currPos, peg$consts[bc[ip + 1]].length).toLowerCase() === peg$consts[bc[ip + 1]]) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 20:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (peg$consts[bc[ip + 1]].test(input.charAt(peg$currPos))) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 21:
              stack.push(input.substr(peg$currPos, bc[ip + 1]));
              peg$currPos += bc[ip + 1];
              ip += 2;
              break;

            case 22:
              stack.push(peg$consts[bc[ip + 1]]);
              peg$currPos += peg$consts[bc[ip + 1]].length;
              ip += 2;
              break;

            case 23:
              stack.push(peg$FAILED);
              if (peg$silentFails === 0) {
                peg$fail(peg$consts[bc[ip + 1]]);
              }
              ip += 2;
              break;

            case 24:
              peg$savedPos = stack[stack.length - 1 - bc[ip + 1]];
              ip += 2;
              break;

            case 25:
              peg$savedPos = peg$currPos;
              ip++;
              break;

            case 26:
              params = bc.slice(ip + 4, ip + 4 + bc[ip + 3]);
              for (i = 0; i < bc[ip + 3]; i++) {
                params[i] = stack[stack.length - 1 - params[i]];
              }

              stack.splice(
                stack.length - bc[ip + 2],
                bc[ip + 2],
                peg$consts[bc[ip + 1]].apply(null, params)
              );

              ip += 4 + bc[ip + 3];
              break;

            case 27:
              stack.push(peg$parseRule(bc[ip + 1]));
              ip += 2;
              break;

            case 28:
              peg$silentFails++;
              ip++;
              break;

            case 29:
              peg$silentFails--;
              ip++;
              break;

            default:
              throw new Error("Invalid opcode: " + bc[ip] + ".");
          }
        }

        if (ends.length > 0) {
          end = ends.pop();
          ip = ips.pop();
        } else {
          break;
        }
      }

      return stack[0];
    }


    	class Node {
    		constructor() {
    			this.isConstant = false;
    			this.hasRandomness = false;
    		}
    	}

    	class CachingNode extends Node {
    		constructor() {
    			super()
    			this.cachedValue = undefined;
    		}

    		eval(variables) {
    			if (this.cachedValue !== undefined) {
    				return this.cachedValue;
    			}
    			const result = this.evalImpl(variables);
    			if (this.isConstant) {
    				this.cachedValue = result;
    			}
    			return result;
    		}
    	}

    	class LeftToRightOperators extends CachingNode {
    		constructor(head, tail, func) {
    			super();
    			this.head = head;
    			this.tail = tail;
    			this.func = func;
    			let isConstant = head.isConstant;
    			let hasRandomness = head.hasRandomness;
    			const numOps = tail.length;
    			for (let i = 0; i < numOps; i++) {
    				isConstant = isConstant && tail[i][3].isConstant;
    				hasRandomness = hasRandomness || tail[i][3].hasRandomness;
    			}
    			this.isConstant = isConstant;
    			this.hasRandomness = hasRandomness;
    		}

    		evalImpl(variables) {
    			const headValue = this.head.eval(variables);
    			const func = this.func;
    			return this.tail.reduce(function (partialResult, element) {
    				return func(partialResult, element[1], element[3], variables);
    			}, headValue);
    		}
    	}

    	function operatorList(head, tail, func) {
    		if (tail.length === 0) {
    			return head;
    		} else {
    			return new LeftToRightOperators(head, tail, func);
    		}
    	}

    	class AbsInvocation extends CachingNode {
    		constructor(name, arg) {
    			super();
    			this.arg = arg;
    			this.isConstant = arg.isConstant;
    			this.hasRandomness = arg.hasRandomness;
    		}

    		evalImpl(variables) {
    			return Math.abs(this.arg.eval(variables));
    		}
    	}

    	class FunctionInvocation extends CachingNode {
    		constructor(name, args) {
    			super();
    			this.name = name;
    			this.args = args;

    			if (name === 'random') {

    				this.hasRandomness = true;

    			} else {

    				let isConstant = true;
    				let hasRandomness = false;
    				const numArgs = args.length;
    				for (let i = 0; i < numArgs; i++) {
    					isConstant = isConstant && args[i].isConstant;
    					hasRandomness = hasRandomness || args[i].hasRandomness;
    				}
    				this.isConstant = isConstant;
    				this.hasRandomness = hasRandomness;

    			}
    		}

    		evalImpl(variables) {
    			const numArgs = this.args.length;
    			const argValues = new Array(numArgs);
    			for (let i = 0; i < numArgs; i++) {
    				argValues[i] = this.args[i].eval(variables);
    			}
    			switch (this.name) {
    			case 'random':
    				return random.next();
    				break;
    			default:
    				return Math[this.name](...argValues);
    			}
    		}
    	}

    	class ImplicitMultiply extends CachingNode {
    		constructor(multiplier, multiplicand) {
    			super();
    			this.multiplier = multiplier.eval();
    			this.multiplicand = multiplicand;
    			this.isConstant = multiplicand.isConstant;
    			this.hasRandomness = multiplicand.hasRandomness;
    		}

    		evalImpl(variables) {
    			return this.multiplier * this.multiplicand.eval(variables);
    		}
    	}

    	class Constant extends Node {
    		constructor(value) {
    			super();
    			this.value = value;
    			this.isConstant = true;
    		}

    		eval(variables) {
    			return this.value;
    		}
    	}

    	Constant.E = new Constant(Math.E);
    	Constant.PI = new Constant(Math.PI);


    	class Variable extends Node {
    		constructor(name) {
    			super();
    			this.name = name;
    		}

    		eval(variables) {
    			return variables.get(this.name);
    		}
    	}


    peg$result = peg$parseRule(peg$startRuleIndex);

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail(peg$endExpectation());
      }

      throw peg$buildStructuredError(
        peg$maxFailExpected,
        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
        peg$maxFailPos < input.length
          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
      );
    }
  }

  return {
    SyntaxError: peg$SyntaxError,
    parse:       peg$parse
  };
})();

const parse = parser.parse;
export default parse;
