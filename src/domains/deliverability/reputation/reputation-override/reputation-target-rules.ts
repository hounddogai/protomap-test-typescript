import * as text from "../../../../kit/text.js";
import { ReputationTarget } from "./reputation-target.js";

/** A rule a reputation target must pass. Check returns its problems, or none. */
export interface ReputationTargetRule {
  check(item: ReputationTarget): string[];
}

export class ReputationTargetMaximumRangeRule implements ReputationTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationTarget): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationTargetAllowedTitleRule implements ReputationTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReputationTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is missing`];
    return [];
  }
}

export class ReputationTargetCodePrefixRule implements ReputationTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReputationTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a reputation target. */
export class ReputationTargetValidator {
  rules: ReputationTargetRule[];

  constructor(rules: ReputationTargetRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationTarget): string[] {
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

  requireValid(item: ReputationTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationTarget[]): Map<string, string[]> {
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

export function defaultReputationTargetValidator(): ReputationTargetValidator {
  return new ReputationTargetValidator(
    [
      new ReputationTargetMaximumRangeRule(8.8, 1230.9),
      new ReputationTargetAllowedTitleRule([]),
      new ReputationTargetCodePrefixRule("ACM"),
    ],
  );
}
