import { BouncePolicy } from "./bounce-policy.js";

/** A rule a bounce policy must pass. Check returns its problems, or none. */
export interface BouncePolicyRule {
  check(item: BouncePolicy): string[];
}

export class BouncePolicyImpressionsRangeRule implements BouncePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BouncePolicy): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BouncePolicyLimitRangeRule implements BouncePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BouncePolicy): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BouncePolicyCreatedAtRangeRule implements BouncePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BouncePolicy): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BouncePolicyRequiredSegmentRule implements BouncePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BouncePolicy): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bounce policy. */
export class BouncePolicyValidator {
  rules: BouncePolicyRule[];

  constructor(rules: BouncePolicyRule[]) {
    this.rules = rules;
  }

  validate(item: BouncePolicy): string[] {
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

  requireValid(item: BouncePolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BouncePolicy[]): Map<string, string[]> {
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

export function defaultBouncePolicyValidator(): BouncePolicyValidator {
  return new BouncePolicyValidator(
    [
      new BouncePolicyImpressionsRangeRule(120, 1000),
      new BouncePolicyLimitRangeRule(120, 86400),
      new BouncePolicyCreatedAtRangeRule(16, 3600),
      new BouncePolicyRequiredSegmentRule("bounce policy needs this field"),
    ],
  );
}
