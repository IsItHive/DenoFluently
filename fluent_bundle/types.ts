import {
    Scope
} from './scope.ts'
export type FluentValue = FluentType<unknown> | string
export type FluentFunction = (
    positional: Array<FluentValue>,
    named: Record<string, FluentValue>
) => FluentValue
export abstract class FluentType<T> {
    public value: T
    constructor(value: T) {
        this.value = value;
    }
    valueOf(): T {
        return this.value;
    }
    abstract toString(scope: Scope): string
}
export class FluentNone extends FluentType<string> {
    constructor(value = "???") {
        super(value);
    }
    toString(scope: Scope): string {
        return `{${this.value}}`
      }
}
export class FluentNumber extends FluentType<number> {
    public opts: Intl.NumberFormatOptions
    constructor(value: number, opts: Intl.NumberFormatOptions = {}) {
        super(value);
        this.opts = opts;
    }
    toString(scope: Scope): string {
        try {
          const nf = scope.memoizeIntlObject(Intl.NumberFormat, this.opts);
          return nf.format(this.value);
        } catch (err) {
          scope.reportError(err);
          return this.value.toString(10);
        }
    }
}
export class FluentDateTime extends FluentType<number> {
    public opts: Intl.DateTimeFormatOptions
    constructor(value: number, opts: Intl.DateTimeFormatOptions = {}) {
        super(value);
        this.opts = opts;
    }
    toString(scope: Scope): string {
        try {
          const dtf = scope.memoizeIntlObject(Intl.DateTimeFormat, this.opts);
          return dtf.format(this.value);
        } catch (err) {
          scope.reportError(err);
          return new Date(this.value).toISOString();
        }
    }
}