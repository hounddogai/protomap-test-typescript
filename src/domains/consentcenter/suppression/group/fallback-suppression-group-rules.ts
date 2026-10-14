import { FallbackSuppressionGroup } from "./fallback-suppression-group.js";

/** A rule a fallback suppression group must pass. Check returns its problems, or none. */
export interface FallbackSuppressionGroupRule {
  check(item: FallbackSuppressionGroup): string[];
}

export class FallbackSuppressionGroupAmountRangeRule implements FallbackSuppressionGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackSuppressionGroup): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackSuppressionGroupCodePrefixRule implements FallbackSuppressionGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackSuppressionGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackSuppressionGroupRequiredContactEmailRule implements FallbackSuppressionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSuppressionGroup): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSuppressionGroupRequiredLocaleRule implements FallbackSuppressionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSuppressionGroup): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback suppression group. */
export class FallbackSuppressionGroupValidator {
  rules: FallbackSuppressionGroupRule[];

  constructor(rules: FallbackSuppressionGroupRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackSuppressionGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackSuppressionGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackSuppressionGroup[]): Map<string, string[]> {
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

export function defaultFallbackSuppressionGroupValidator(): FallbackSuppressionGroupValidator {
  return new FallbackSuppressionGroupValidator(
    [
      new FallbackSuppressionGroupAmountRangeRule(7.6, 4080.6),
      new FallbackSuppressionGroupCodePrefixRule("REF"),
      new FallbackSuppressionGroupRequiredContactEmailRule("fallback suppression group needs a value"),
      new FallbackSuppressionGroupRequiredLocaleRule("fallback suppression group needs a value"),
    ],
  );
}
