import { LenientRetentionForecast } from "./lenient-retention-forecast.js";

/** A rule a lenient retention forecast must pass. Check returns its problems, or none. */
export interface LenientRetentionForecastRule {
  check(item: LenientRetentionForecast): string[];
}

export class LenientRetentionForecastSegmentLengthRule implements LenientRetentionForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRetentionForecast): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRetentionForecastRequiredChecksumRule implements LenientRetentionForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientRetentionForecast): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class LenientRetentionForecastRequiredLabelRule implements LenientRetentionForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientRetentionForecast): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientRetentionForecastCodePrefixRule implements LenientRetentionForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientRetentionForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientRetentionForecastFloorValueRangeRule implements LenientRetentionForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientRetentionForecast): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient retention forecast. */
export class LenientRetentionForecastValidator {
  rules: LenientRetentionForecastRule[];

  constructor(rules: LenientRetentionForecastRule[]) {
    this.rules = rules;
  }

  validate(item: LenientRetentionForecast): string[] {
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

  requireValid(item: LenientRetentionForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientRetentionForecast[]): Map<string, string[]> {
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

export function defaultLenientRetentionForecastValidator(): LenientRetentionForecastValidator {
  return new LenientRetentionForecastValidator(
    [
      new LenientRetentionForecastSegmentLengthRule(86400),
      new LenientRetentionForecastRequiredChecksumRule("lenient retention forecast needs an entry"),
      new LenientRetentionForecastRequiredLabelRule("lenient retention forecast needs a value"),
      new LenientRetentionForecastCodePrefixRule("REF"),
      new LenientRetentionForecastFloorValueRangeRule(1.2, 2012),
    ],
  );
}
