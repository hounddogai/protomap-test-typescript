import { TieredComplaintOverride } from "./tiered-complaint-override.js";

/** A rule a tiered complaint override must pass. Check returns its problems, or none. */
export interface TieredComplaintOverrideRule {
  check(item: TieredComplaintOverride): string[];
}

export class TieredComplaintOverrideRevisionRangeRule implements TieredComplaintOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredComplaintOverride): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredComplaintOverrideRequiredNameRule implements TieredComplaintOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredComplaintOverride): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredComplaintOverrideLocaleLengthRule implements TieredComplaintOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredComplaintOverride): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredComplaintOverrideConversionRateRangeRule implements TieredComplaintOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredComplaintOverride): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered complaint override. */
export class TieredComplaintOverrideValidator {
  rules: TieredComplaintOverrideRule[];

  constructor(rules: TieredComplaintOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: TieredComplaintOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredComplaintOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredComplaintOverride[]): Map<string, string[]> {
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

export function defaultTieredComplaintOverrideValidator(): TieredComplaintOverrideValidator {
  return new TieredComplaintOverrideValidator(
    [
      new TieredComplaintOverrideRevisionRangeRule(64, 1000),
      new TieredComplaintOverrideRequiredNameRule("tiered complaint override needs an entry"),
      new TieredComplaintOverrideLocaleLengthRule(1000),
      new TieredComplaintOverrideConversionRateRangeRule(8.7, 824.9),
    ],
  );
}
