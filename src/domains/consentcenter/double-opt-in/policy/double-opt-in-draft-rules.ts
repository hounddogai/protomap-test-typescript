import { DoubleOptInDraft } from "./double-opt-in-draft.js";

/** A rule a double opt in draft must pass. Check returns its problems, or none. */
export interface DoubleOptInDraftRule {
  check(item: DoubleOptInDraft): string[];
}

export class DoubleOptInDraftCodePrefixRule implements DoubleOptInDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DoubleOptInDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DoubleOptInDraftBatchSizeRangeRule implements DoubleOptInDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInDraft): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DoubleOptInDraftDiscountRangeRule implements DoubleOptInDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInDraft): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a double opt in draft. */
export class DoubleOptInDraftValidator {
  rules: DoubleOptInDraftRule[];

  constructor(rules: DoubleOptInDraftRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInDraft[]): Map<string, string[]> {
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

export function defaultDoubleOptInDraftValidator(): DoubleOptInDraftValidator {
  return new DoubleOptInDraftValidator(
    [
      new DoubleOptInDraftCodePrefixRule("X"),
      new DoubleOptInDraftBatchSizeRangeRule(80, 255),
      new DoubleOptInDraftDiscountRangeRule(9.3, 3778.3),
    ],
  );
}
