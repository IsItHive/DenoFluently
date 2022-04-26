import {
    resolveComplexPattern
} from "./resolver.ts"
import {
    Scope
} from "./scope.ts"
import {
    FluentResource
} from "./resource.ts"
import {
    FluentValue,
    FluentNone,
    FluentFunction
} from "./types.ts"
import {
    Message,
    Term,
    Pattern
} from "./ast.ts"
import {
    NUMBER,
    DATETIME
} from "./builtins.ts"
import {
    getMemoizerForLocale,
    IntlCache
} from "./memoizer.ts"

export type TextTransform = (text: string) => string

type NativeValue = string | number | Date
export type FluentVariable = FluentValue | NativeValue
export class FluentBundle {
    public locales: Array<string>
    public _terms: Map<string, Term> = new Map()
    public _messages: Map<string, Message> = new Map()
    public _functions: Record<string, FluentFunction>
    public _useIsolating: boolean
    public _transform: TextTransform
    public _intls: IntlCache

    constructor(
        locales: string | Array<string>,
        {
          functions,
          useIsolating = true,
          transform = (v: string): string => v
        }: {
          functions?: Record<string, FluentFunction>;
          useIsolating?: boolean;
          transform?: TextTransform;
        } = {}
      ) {
        this.locales = Array.isArray(locales) ? locales : [locales]
        this._functions = {
          NUMBER,
          DATETIME,
          ...functions
        };
        this._useIsolating = useIsolating;
        this._transform = transform
        this._intls = getMemoizerForLocale(locales)
        }
        hasMessage(id: string): boolean {
            return this._messages.has(id)
        }
        getMessage(id: string): Message | undefined {
            return this._messages.get(id)
        }
        addResource(
            res: FluentResource,
            { allowOverrides = false }: { allowOverrides?: boolean } = {}
            ): Array<Error> {
            const errors = []
            for (let i = 0; i < res.body.length; i++) {
              let entry = res.body[i]
              if (entry.id.startsWith("-")) {
                if (allowOverrides === false && this._terms.has(entry.id)) {
                  errors.push(
                    new Error(`Attempt to override an existing term: "${entry.id}"`)
                  );
                  continue
                }
                this._terms.set(entry.id, entry as Term);
              } else {
                if (allowOverrides === false && this._messages.has(entry.id)) {
                  errors.push(
                    new Error(`Attempt to override an existing message: "${entry.id}"`)
                  );
                  continue
                }
                this._messages.set(entry.id, entry)
              }
            }
            return errors
            }
            formatPattern(
                pattern: Pattern,
                args: Record<string, FluentVariable> | null = null,
                errors: Array<Error> | null = null
              ): string {
                if (typeof pattern === "string") {
                  return this._transform(pattern);
                }
                let scope = new Scope(this, errors, args)
    try {
      let value = resolveComplexPattern(scope, pattern)
      return value.toString(scope)
    } catch (err) {
      if (scope.errors && err instanceof Error) {
        scope.errors.push(err);
        return new FluentNone().toString(scope)
      }
      throw err
    }
  }
}