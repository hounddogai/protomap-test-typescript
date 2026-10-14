import { CappedPlacementForecast } from "./capped-placement-forecast.js";

/** A rule a capped placement forecast must pass. Check returns its problems, or none. */
export interface CappedPlacementForecastRule {
  check(item: CappedPlacementForecast): string[];
}

export class CappedPlacementForecastCodePrefixRule implements CappedPlacementForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedPlacementForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedPlacementForecastTitleLengthRule implements CappedPlacementForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPlacementForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedPlacementForecastRequiredAudienceIdRule implements CappedPlacementForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPlacementForecast): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped placement forecast. */
export class CappedPlacementForecastValidator {
  rules: CappedPlacementForecastRule[];

  constructor(rules: CappedPlacementForecastRule[]) {
    this.rules = rules;
  }

  validate(item: CappedPlacementForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: CappedPlacementForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedPlacementForecast[]): Map<string, string[]> {
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

export function defaultCappedPlacementForecastValidator(): CappedPlacementForecastValidator {
  return new CappedPlacementForecastValidator(
    [
      new CappedPlacementForecastCodePrefixRule("REF"),
      new CappedPlacementForecastTitleLengthRule(86400),
      new CappedPlacementForecastRequiredAudienceIdRule("capped placement forecast needs this field"),
    ],
  );
}
