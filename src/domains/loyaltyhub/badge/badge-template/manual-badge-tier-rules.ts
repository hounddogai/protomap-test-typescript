import * as text from "../../../../kit/text.js";
import { ManualBadgeTier } from "./manual-badge-tier.js";

/** A rule a manual badge tier must pass. Check returns its problems, or none. */
export interface ManualBadgeTierRule {
  check(item: ManualBadgeTier): string[];
}

export class ManualBadgeTierCodePrefixRule implements ManualBadgeTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualBadgeTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualBadgeTierMaximumRangeRule implements ManualBadgeTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualBadgeTier): string[] {
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

export class ManualBadgeTierCeilingRangeRule implements ManualBadgeTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualBadgeTier): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualBadgeTierAllowedNameRule implements ManualBadgeTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualBadgeTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

/** Runs every rule of a manual badge tier. */
export class ManualBadgeTierValidator {
  rules: ManualBadgeTierRule[];

  constructor(rules: ManualBadgeTierRule[]) {
    this.rules = rules;
  }

  validate(item: ManualBadgeTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualBadgeTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualBadgeTier[]): Map<string, string[]> {
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

export function defaultManualBadgeTierValidator(): ManualBadgeTierValidator {
  return new ManualBadgeTierValidator(
    [
      new ManualBadgeTierCodePrefixRule("ACM"),
      new ManualBadgeTierMaximumRangeRule(7, 4605.3),
      new ManualBadgeTierCeilingRangeRule(7.1, 3097),
      new ManualBadgeTierAllowedNameRule(["strict", "weighted", "primary"]),
    ],
  );
}
