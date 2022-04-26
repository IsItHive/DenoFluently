import {Locale} from "./locale.ts"
export function filterMatches(
    requestedLocales: Array<string>,
    availableLocales: Array<string>,
    strategy: string
    ): Array<string> {
    const supportedLocales: Set<string> = new Set()
    const availableLocalesMap: Map<string, Locale> = new Map()
    for (let locale of availableLocales) {
      let newLocale = new Locale(locale)
      if (newLocale.isWellFormed) {
        availableLocalesMap.set(locale, new Locale(locale))
      }
    }
    outer:
    for (const reqLocStr of requestedLocales) {
    const reqLocStrLC = reqLocStr.toLowerCase()
    const requestedLocale = new Locale(reqLocStrLC)

    if (requestedLocale.language === undefined) {
      continue
    }
    for (const key of availableLocalesMap.keys()) {
        if (reqLocStrLC === key.toLowerCase()) {
          supportedLocales.add(key)
          availableLocalesMap.delete(key)
          if (strategy === "lookup") {
            return Array.from(supportedLocales)
            } else if (strategy === "filtering") {
                continue
            }
            else
            {
                continue outer
            }
        }
    }
    for (const [key, availableLocale] of availableLocalesMap.entries()) {
        if (availableLocale.matches(requestedLocale, true, false)) {
          supportedLocales.add(key)
          availableLocalesMap.delete(key)
          if (strategy === "lookup") {
            return Array.from(supportedLocales)
            } else if (strategy === "filtering") {
                continue
            }
            else
            {
                continue outer
            }
        }
    }
    if (requestedLocale.addLikelySubtags()) {
        for (const [key, availableLocale] of availableLocalesMap.entries()) {
          if (availableLocale.matches(requestedLocale, true, false)) {
            supportedLocales.add(key)
            availableLocalesMap.delete(key)
            if (strategy === "lookup") {
              return Array.from(supportedLocales)
            } else if (strategy === "filtering") {
              continue
            } else {
              continue outer
            }
          }
        }
    }
    requestedLocale.clearVariants()
    for (const [key, availableLocale] of availableLocalesMap.entries()) {
        if (availableLocale.matches(requestedLocale, true, true)) {
          supportedLocales.add(key)
          availableLocalesMap.delete(key)
          if (strategy === "lookup") {
            return Array.from(supportedLocales)
          } else if (strategy === "filtering") {
            continue
          } else {
            continue outer
          }
        }
    }
    requestedLocale.clearRegion()
    if (requestedLocale.addLikelySubtags()) {
        for (const [key, availableLocale] of availableLocalesMap.entries()) {
          if (availableLocale.matches(requestedLocale, true, false)) {
            supportedLocales.add(key)
            availableLocalesMap.delete(key)
            if (strategy === "lookup") {
              return Array.from(supportedLocales)
            } else if (strategy === "filtering") {
              continue
            } else {
              continue outer
            }
          }
        }
    }
    requestedLocale.clearRegion()
    for (const [key, availableLocale] of availableLocalesMap.entries()) {
        if (availableLocale.matches(requestedLocale, true, true)) {
          supportedLocales.add(key)
          availableLocalesMap.delete(key)
          if (strategy === "lookup") {
            return Array.from(supportedLocales)
          } else if (strategy === "filtering") {
            continue
          } else {
            continue outer
          }
        }
    }
    }
    return Array.from(supportedLocales)
}