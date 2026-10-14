import { BounceTier } from "./bounce-tier.js";

/** A rule a bounce tier must pass. Check returns its problems, or none. */
export interface BounceTierRule {
  check(item: BounceTier): string[];
}

export class BounceTierMaximumRangeRule implements BounceTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceTier): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BounceTierVariantLengthRule implements BounceTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceTier): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceTierNameLengthRule implements BounceTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceTier): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bounce tier. */
export class BounceTierValidator {
  rules: BounceTierRule[];

  constructor(rules: BounceTierRule[]) {
    this.rules = rules;
  }

  validate(item: BounceTier): string[] {
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

  requireValid(item: BounceTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceTier[]): Map<string, string[]> {
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

export function defaultBounceTierValidator(): BounceTierValidator {
  return new BounceTierValidator(
    [
      new BounceTierMaximumRangeRule(8.6, 4909.4),
      new BounceTierVariantLengthRule(16),
      new BounceTierNameLengthRule(3600),
    ],
  );
}
