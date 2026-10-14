import { RewardWindow } from "./reward-window.js";

/** A rule a reward window must pass. Check returns its problems, or none. */
export interface RewardWindowRule {
  check(item: RewardWindow): string[];
}

export class RewardWindowCodeLengthRule implements RewardWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardWindowNameLengthRule implements RewardWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardWindow): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardWindowCodePrefixRule implements RewardWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardWindowCohortLengthRule implements RewardWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardWindow): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardWindowRequiredTitleRule implements RewardWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardWindow): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RewardWindowRequiredCodeRule implements RewardWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward window. */
export class RewardWindowValidator {
  rules: RewardWindowRule[];

  constructor(rules: RewardWindowRule[]) {
    this.rules = rules;
  }

  validate(item: RewardWindow): string[] {
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

  requireValid(item: RewardWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardWindow[]): Map<string, string[]> {
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

export function defaultRewardWindowValidator(): RewardWindowValidator {
  return new RewardWindowValidator(
    [
      new RewardWindowCodeLengthRule(32),
      new RewardWindowNameLengthRule(120),
      new RewardWindowCodePrefixRule("Q"),
      new RewardWindowCohortLengthRule(80),
      new RewardWindowRequiredTitleRule("reward window needs a value"),
      new RewardWindowRequiredCodeRule("reward window needs a value"),
    ],
  );
}
