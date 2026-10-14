import { GlobalRewardBaseline } from "./global-reward-baseline.js";

/** A rule a global reward baseline must pass. Check returns its problems, or none. */
export interface GlobalRewardBaselineRule {
  check(item: GlobalRewardBaseline): string[];
}

export class GlobalRewardBaselineRequiredTitleRule implements GlobalRewardBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardBaseline): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardBaselineCodeLengthRule implements GlobalRewardBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRewardBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRewardBaselineSourceLengthRule implements GlobalRewardBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRewardBaseline): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global reward baseline. */
export class GlobalRewardBaselineValidator {
  rules: GlobalRewardBaselineRule[];

  constructor(rules: GlobalRewardBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRewardBaseline): string[] {
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

  requireValid(item: GlobalRewardBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRewardBaseline[]): Map<string, string[]> {
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

export function defaultGlobalRewardBaselineValidator(): GlobalRewardBaselineValidator {
  return new GlobalRewardBaselineValidator(
    [
      new GlobalRewardBaselineRequiredTitleRule("global reward baseline needs a value"),
      new GlobalRewardBaselineCodeLengthRule(255),
      new GlobalRewardBaselineSourceLengthRule(80),
    ],
  );
}
