import {filterMatches} from "./matches.ts";

export interface NegotiateLanguagesOptions {
  strategy?: "filtering" | "matching" | "lookup";
  defaultLocale?: string;
}
export function negotiateLanguages(
    requestedLocales: Readonly<Array<string>>,
    availableLocales: Readonly<Array<string>>,
    {
      strategy = "filtering",
      defaultLocale,
    }: NegotiateLanguagesOptions = {}
): Array<string> {
    const supportedLocales = filterMatches(
        Array.from(Object(requestedLocales)).map(String),
        Array.from(Object(availableLocales)).map(String),
        strategy
    )
    if (strategy === "lookup") {
        if (defaultLocale === undefined) {
            throw new Error(
                "defaultLocale cannot be undefined for strategy `lookup`")
        }
        if (supportedLocales.length === 0) {
            supportedLocales.push(defaultLocale)
        }
    } else if (defaultLocale && !supportedLocales.includes(defaultLocale)) {
        supportedLocales.push(defaultLocale)
    }
    return supportedLocales
}