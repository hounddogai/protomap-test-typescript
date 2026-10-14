import { GlobalCreativeForecast } from "./global-creative-forecast.js";

/** A rule a global creative forecast must pass. Check returns its problems, or none. */
export interface GlobalCreativeForecastRule {
  check(item: GlobalCreativeForecast): string[];
}

export class GlobalCreativeForecastRegionLengthRule implements GlobalCreativeForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalCreativeForecast): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalCreativeForecastCodePrefixRule implements GlobalCreativeForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalCreativeForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalCreativeForecastRequiredNameRule implements GlobalCreativeForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCreativeForecast): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCreativeForecastApprovedGuardRule implements GlobalCreativeForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalCreativeForecast): string[] {
    if (item.approved && item.limit > this.limit) return [`limit ${item.limit} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class GlobalCreativeForecastNameLengthRule implements GlobalCreativeForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalCreativeForecast): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global creative forecast. */
export class GlobalCreativeForecastValidator {
  rules: GlobalCreativeForecastRule[];

  constructor(rules: GlobalCreativeForecastRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalCreativeForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalCreativeForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalCreativeForecast[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultGlobalCreativeForecastValidator(): GlobalCreativeForecastValidator {
  return new GlobalCreativeForecastValidator(
    [
      new GlobalCreativeForecastRegionLengthRule(1000),
      new GlobalCreativeForecastCodePrefixRule("ACM"),
      new GlobalCreativeForecastRequiredNameRule("global creative forecast needs an entry"),
      new GlobalCreativeForecastApprovedGuardRule(3600),
      new GlobalCreativeForecastNameLengthRule(255),
    ],
  );
}
