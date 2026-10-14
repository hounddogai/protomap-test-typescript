import { SuppressionOverride } from "./suppression-override.js";

/** A rule a suppression override must pass. Check returns its problems, or none. */
export interface SuppressionOverrideRule {
  check(item: SuppressionOverride): string[];
}

export class SuppressionOverrideUpdatedAtRangeRule implements SuppressionOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionOverride): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SuppressionOverrideReviewerLengthRule implements SuppressionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionOverride): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionOverrideCodePrefixRule implements SuppressionOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SuppressionOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SuppressionOverrideRequiredLocaleRule implements SuppressionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionOverride): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a suppression override. */
export class SuppressionOverrideValidator {
  rules: SuppressionOverrideRule[];

  constructor(rules: SuppressionOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionOverride[]): Map<string, string[]> {
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

export function defaultSuppressionOverrideValidator(): SuppressionOverrideValidator {
  return new SuppressionOverrideValidator(
    [
      new SuppressionOverrideUpdatedAtRangeRule(16, 32),
      new SuppressionOverrideReviewerLengthRule(255),
      new SuppressionOverrideCodePrefixRule("OPS"),
      new SuppressionOverrideRequiredLocaleRule("suppression override needs an entry"),
    ],
  );
}
