import { RewardBaseline } from "./reward-baseline.js";

/** A rule a reward baseline must pass. Check returns its problems, or none. */
export interface RewardBaselineRule {
  check(item: RewardBaseline): string[];
}

export class RewardBaselineRequiredReviewerRule implements RewardBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardBaseline): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class RewardBaselineRequiredLabelRule implements RewardBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardBaseline): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RewardBaselineChecksumLengthRule implements RewardBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardBaseline): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardBaselineCodeLengthRule implements RewardBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward baseline. */
export class RewardBaselineValidator {
  rules: RewardBaselineRule[];

  constructor(rules: RewardBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: RewardBaseline): string[] {
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

  requireValid(item: RewardBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardBaseline[]): Map<string, string[]> {
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

export function defaultRewardBaselineValidator(): RewardBaselineValidator {
  return new RewardBaselineValidator(
    [
      new RewardBaselineRequiredReviewerRule("reward baseline needs this field"),
      new RewardBaselineRequiredLabelRule("reward baseline needs this field"),
      new RewardBaselineChecksumLengthRule(32),
      new RewardBaselineCodeLengthRule(120),
    ],
  );
}
