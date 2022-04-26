import {
    FluentValue,
    FluentType,
    FluentNone,
    FluentNumber,
    FluentDateTime
} from "./types.ts"
import { Scope } from "./scope.ts"
import {
    Variant,
    Expression,
    NamedArgument,
    VariableReference,
    MessageReference,
    TermReference,
    FunctionReference,
    SelectExpression,
    ComplexPattern,
    Pattern
} from "./ast.ts"
import { FluentVariable } from "./bundle.ts"

const MAX_PLACEABLES = 100
const FSI = "\u2068"
const PDI = "\u2069"
function match(scope: Scope, selector: FluentValue, key: FluentValue): boolean {
    if (key === selector) {
        return true
    }
    if (
        key instanceof FluentNumber &&
        selector instanceof FluentNumber &&
        key.value === selector.value
      ) {
        return true
      }
    if (selector instanceof FluentNumber && typeof key === "string") {
        let category = scope
          .memoizeIntlObject(
            Intl.PluralRules,
            selector.opts as Intl.PluralRulesOptions
          )
          .select(selector.value)
        if (key === category) {
          return true;
        }
    }
    return false;
}
function getDefault(
    scope: Scope,
    variants: Array<Variant>,
    star: number
): FluentValue {
    if (variants[star]) {
      return resolvePattern(scope, variants[star].value)
    }
  
    scope.reportError(new RangeError("No default"))
    return new FluentNone()
}
interface Arguments {
    positional: Array<FluentValue>;
    named: Record<string, FluentValue>;
}
function getArguments(
    scope: Scope,
    args: Array<Expression | NamedArgument>
): Arguments {
    const positional: Array<FluentValue> = []
    const named = Object.create(null) as Record<string, FluentValue>
    for (const arg of args) {
      if (arg.type === "narg") {
        named[arg.name] = resolveExpression(scope, arg.value)
      } else {
        positional.push(resolveExpression(scope, arg))
      }
    }
return { positional, named };
}
function resolveExpression(scope: Scope, expr: Expression): FluentValue {
    switch (expr.type) {
        case "str":
            return expr.value
        case "num":
            return new FluentNumber(expr.value, {
                minimumFractionDigits: expr.precision
            })
        case "var":
            return resolveVariableReference(scope, expr)
        case "mesg":
            return resolveMessageReference(scope, expr)
        case "term":
            return resolveTermReference(scope, expr)
        case "func":
            return resolveFunctionReference(scope, expr)
        case "select":
            return resolveSelectExpression(scope, expr)
        default:
            return new FluentNone()
    }
}
function resolveVariableReference(
    scope: Scope,
    { name }: VariableReference
): FluentValue {
    let arg: FluentVariable
    if (scope.params) {
        if (Object.prototype.hasOwnProperty.call(scope.params, name)) {
            arg = scope.params[name]
        }
        else
        {
            return new FluentNone(`$${name}`)
        }
    }
    else if (
        scope.args
        && Object.prototype.hasOwnProperty.call(scope.args, name)
    ) {
        arg = scope.args[name]
    }
    else {
        scope.reportError(new ReferenceError(`Unknown variable: $${name}`))
        return new FluentNone(`$${name}`)
    }
    if (arg instanceof FluentType) {
        return arg
    }
    switch (typeof arg) {
        case "string":
          return arg
        case "number":
          return new FluentNumber(arg)
        case "object":
          if (arg instanceof Date) {
            return new FluentDateTime(arg.getTime())
          }
        default:
        scope.reportError(
            new TypeError(`Variable type not supported: $${name}, ${typeof arg}`)
        );
    return new FluentNone(`$${name}`);
    }
}
function resolveMessageReference(
    scope: Scope,
    { name, attr }: MessageReference
): FluentValue {
    const message = scope.bundle._messages.get(name)
    if (!message) {
      scope.reportError(new ReferenceError(`Unknown message: ${name}`))
      return new FluentNone(name)
    }
    if (attr) {
        const attribute = message.attributes[attr]
        if (attribute) {
          return resolvePattern(scope, attribute)
        }
        scope.reportError(new ReferenceError(`Unknown attribute: ${attr}`))
        return new FluentNone(`${name}.${attr}`)
    }
    if (message.value) {
        return resolvePattern(scope, message.value)
    }
    scope.reportError(new ReferenceError(`No value: ${name}`))
    return new FluentNone(name)
}
function resolveTermReference(
    scope: Scope,
    { name, attr, args }: TermReference
): FluentValue {
    const id = `-${name}`
    const term = scope.bundle._terms.get(id)
    if (!term) {
      scope.reportError(new ReferenceError(`Unknown term: ${id}`))
      return new FluentNone(id)
    }
    if (attr) {
        const attribute = term.attributes[attr]
        if (attribute) {
          // Every TermReference has its own variables.
          scope.params = getArguments(scope, args).named
          const resolved = resolvePattern(scope, attribute)
          scope.params = null
          return resolved
        }
        scope.reportError(new ReferenceError(`Unknown attribute: ${attr}`))
        return new FluentNone(`${id}.${attr}`)
    }
    scope.params = getArguments(scope, args).named
    const resolved = resolvePattern(scope, term.value)
    scope.params = null
    return resolved
}
function resolveFunctionReference(
    scope: Scope,
    { name, args }: FunctionReference
): FluentValue {
    let func = scope.bundle._functions[name]
    if (!func) {
        scope.reportError(new ReferenceError(`Unknown function: ${name}()`))
        return new FluentNone(`${name}()`)
    }
    if (typeof func !== "function") {
        scope.reportError(new TypeError(`Function ${name}() is not callable`))
        return new FluentNone(`${name}()`)
    }
    try {
        let resolved = getArguments(scope, args)
        return func(resolved.positional, resolved.named)
    } catch (err) {
        scope.reportError(err)
        return new FluentNone(`${name}()`)
    }
}
function resolveSelectExpression(
    scope: Scope,
    { selector, variants, star }: SelectExpression
): FluentValue {
    let sel = resolveExpression(scope, selector)
    if (sel instanceof FluentNone) {
      return getDefault(scope, variants, star)
    }
    for (const variant of variants) {
        const key = resolveExpression(scope, variant.key)
        if (match(scope, sel, key)) {
          return resolvePattern(scope, variant.value)
        }
    }
    return getDefault(scope, variants, star)
}
export function resolveComplexPattern(
    scope: Scope,
    ptn: ComplexPattern
): FluentValue {
    if (scope.dirty.has(ptn)) {
      scope.reportError(new RangeError("Cyclic reference"))
      return new FluentNone()
    }
    scope.dirty.add(ptn)
    const result = []
    const useIsolating = scope.bundle._useIsolating && ptn.length > 1
    for (const elem of ptn) {
        if (typeof elem === "string") {
          result.push(scope.bundle._transform(elem));
          continue;
        }
        scope.placeables++;
        if (scope.placeables > MAX_PLACEABLES) {
        scope.dirty.delete(ptn)
        throw new RangeError(
            `Too many placeables expanded: ${scope.placeables}, ` +
            `max allowed is ${MAX_PLACEABLES}`
        )
        }
        if (useIsolating) {
            result.push(FSI)
        }
        result.push(resolveExpression(scope, elem).toString(scope))
        if (useIsolating) {
            result.push(PDI)
          }
        }
        scope.dirty.delete(ptn)
        return result.join("")
}
function resolvePattern(scope: Scope, value: Pattern): FluentValue {
    if (typeof value === "string") {
        return scope.bundle._transform(value)
    }
    return resolveComplexPattern(scope, value)
}