import { TierAdjustment } from "./tier-adjustment.js";

/** A rule a tier adjustment must pass. Check returns its problems, or none. */
export interface TierAdjustmentRule {
  check(item: TierAdjustment): string[];
}

export class TierAdjustmentCountryLengthRule implements TierAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierAdjustment): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierAdjustmentTitleLengthRule implements TierAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierAdjustmentRequiredCountryRule implements TierAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierAdjustment): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class TierAdjustmentRequiredSourceRule implements TierAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierAdjustment): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tier adjustment. */
export class TierAdjustmentValidator {
  rules: TierAdjustmentRule[];

  constructor(rules: TierAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: TierAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierAdjustment[]): Map<string, string[]> {
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

export function defaultTierAdjustmentValidator(): TierAdjustmentValidator {
  return new TierAdjustmentValidator(
    [
      new TierAdjustmentCountryLengthRule(16),
      new TierAdjustmentTitleLengthRule(32),
      new TierAdjustmentRequiredCountryRule("tier adjustment needs an entry"),
      new TierAdjustmentRequiredSourceRule("tier adjustment needs a value"),
    ],
  );
}
