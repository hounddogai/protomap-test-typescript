import { ReputationOverride } from "./reputation-override.js";

/** A rule a reputation override must pass. Check returns its problems, or none. */
export interface ReputationOverrideRule {
  check(item: ReputationOverride): string[];
}

export class ReputationOverrideRequiredLabelRule implements ReputationOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationOverride): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationOverrideDiscountRangeRule implements ReputationOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationOverride): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationOverrideAmountRangeRule implements ReputationOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationOverride): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationOverrideCodeLengthRule implements ReputationOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reputation override. */
export class ReputationOverrideValidator {
  rules: ReputationOverrideRule[];

  constructor(rules: ReputationOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationOverride): string[] {
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

  requireValid(item: ReputationOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationOverride[]): Map<string, string[]> {
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

export function defaultReputationOverrideValidator(): ReputationOverrideValidator {
  return new ReputationOverrideValidator(
    [
      new ReputationOverrideRequiredLabelRule("reputation override needs an entry"),
      new ReputationOverrideDiscountRangeRule(2.5, 2303.7),
      new ReputationOverrideAmountRangeRule(7.5, 749),
      new ReputationOverrideCodeLengthRule(80),
    ],
  );
}
