import {
    FluentValue,
    FluentNone,
    FluentNumber,
    FluentDateTime
} from "./types.ts"
function values(
    opts: Record<string, FluentValue>,
    allowed: Array<String>
): Record<string, unknown> {
    const unwrapped = Object.create(null) as Record<string, unknown>
    for (const [name, opt] of Object.entries(opts)) {
        if (allowed.includes(name)) {
          unwrapped[name] = opt.valueOf();
        }
      }
      return unwrapped
}
const NUMBER_ALLOWED = [
    "unitDisplay",
    "currencyDisplay",
    "useGrouping",
    "minimumIntegerDigits",
    "minimumFractionDigits",
    "maximumFractionDigits",
    "minimumSignificantDigits",
    "maximumSignificantDigits",
]
export function NUMBER(
    args: Array<FluentValue>,
    opts: Record<string, FluentValue>
): FluentValue {
    let arg = args[0]
    if (arg instanceof FluentNone) {
        return new FluentNone(`NUMBER(${arg.valueOf()})`);
      }
      if (arg instanceof FluentNumber) {
        return new FluentNumber(arg.valueOf(), {
          ...arg.opts,
          ...values(opts, NUMBER_ALLOWED)
        });
      }
      if (arg instanceof FluentDateTime) {
        return new FluentNumber(arg.valueOf(), {
          ...values(opts, NUMBER_ALLOWED)
        });
      }
      throw new TypeError("Invalid argument to NUMBER")
    }
const DATETIME_ALLOWED = [
    "dateStyle",
    "timeStyle",
    "fractionalSecondDigits",
    "dayPeriod",
    "hour12",
    "weekday",
    "era",
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
    "timeZoneName",
]
export function DATETIME(
    args: Array<FluentValue>,
    opts: Record<string, FluentValue>
  ): FluentValue {
    let arg = args[0]
    if (arg instanceof FluentNone) {
        return new FluentNone(`DATETIME(${arg.valueOf()})`);
    }
    if (arg instanceof FluentDateTime) {
        return new FluentDateTime(arg.valueOf(), {
          ...arg.opts,
          ...values(opts, DATETIME_ALLOWED)
        })
    }
    if (arg instanceof FluentNumber) {
        return new FluentDateTime(arg.valueOf(), {
          ...values(opts, DATETIME_ALLOWED)
        })
    }
    throw new TypeError("Invalid argument to DATETIME")
}