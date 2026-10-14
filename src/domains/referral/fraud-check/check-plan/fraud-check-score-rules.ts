import { FraudCheckScore } from "./fraud-check-score.js";

/** A rule a fraud check score must pass. Check returns its problems, or none. */
export interface FraudCheckScoreRule {
  check(item: FraudCheckScore): string[];
}

export class FraudCheckScoreRequiredCodeRule implements FraudCheckScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckScoreCodeLengthRule implements FraudCheckScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckScoreRequiredNameRule implements FraudCheckScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckScore): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckScorePinnedGuardRule implements FraudCheckScoreRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FraudCheckScore): string[] {
    if (item.pinned && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class FraudCheckScoreAttemptsRangeRule implements FraudCheckScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckScore): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FraudCheckScoreCodePrefixRule implements FraudCheckScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FraudCheckScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a fraud check score. */
export class FraudCheckScoreValidator {
  rules: FraudCheckScoreRule[];

  constructor(rules: FraudCheckScoreRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckScore): string[] {
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

  requireValid(item: FraudCheckScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckScore[]): Map<string, string[]> {
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

export function defaultFraudCheckScoreValidator(): FraudCheckScoreValidator {
  return new FraudCheckScoreValidator(
    [
      new FraudCheckScoreRequiredCodeRule("fraud check score needs an entry"),
      new FraudCheckScoreCodeLengthRule(3600),
      new FraudCheckScoreRequiredNameRule("fraud check score needs this field"),
      new FraudCheckScorePinnedGuardRule(0.9),
      new FraudCheckScoreAttemptsRangeRule(120, 3600),
      new FraudCheckScoreCodePrefixRule("ACM"),
    ],
  );
}
