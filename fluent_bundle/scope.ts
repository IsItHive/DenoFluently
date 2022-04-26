import { FluentBundle, FluentVariable } from "./bundle.ts"
import { ComplexPattern } from "./ast.ts"
export class Scope {
    public bundle: FluentBundle
    public errors: Array<Error> | null
    public args: Record<string, FluentVariable> | null
    public dirty: WeakSet<ComplexPattern> = new WeakSet()
    public params: Record<string, FluentVariable> | null = null
    public placeables: number = 0
    constructor(
        bundle: FluentBundle,
        errors: Array<Error> | null,
        args: Record<string, FluentVariable> | null,
    ){
        this.bundle = bundle;
        this.errors = errors;
        this.args = args;
    }
    reportError(error: unknown): void {
        if (!this.errors || !(error instanceof Error)) {
          throw error;
        }
        this.errors.push(error);
    }
    memoizeIntlObject(
        ctor: typeof Intl.NumberFormat,
        opts: Intl.NumberFormatOptions
    ): Intl.NumberFormat
    memoizeIntlObject(
        ctor: typeof Intl.DateTimeFormat,
        opts: Intl.DateTimeFormatOptions
    ): Intl.DateTimeFormat
    memoizeIntlObject(
        ctor: typeof Intl.PluralRules,
        opts: Intl.PluralRulesOptions
    ): Intl.PluralRules
    memoizeIntlObject(
        ctor:
          | typeof Intl.NumberFormat
          | typeof Intl.DateTimeFormat
          | typeof Intl.PluralRules,
        opts: Intl.NumberFormatOptions &
          Intl.DateTimeFormatOptions &
          Intl.PluralRulesOptions
    ): Intl.NumberFormat | Intl.DateTimeFormat | Intl.PluralRules {
        let cache = this.bundle._intls.get(ctor)
        if (!cache) {
            cache = {};
            this.bundle._intls.set(ctor, cache);
        }
        let id = JSON.stringify(opts)
        if (!cache[id]) {
            cache[id] = new ctor(this.bundle.locales, opts)
        }
    return cache[id]
    }
}