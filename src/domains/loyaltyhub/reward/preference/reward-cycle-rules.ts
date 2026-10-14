import { RewardCycle } from "./reward-cycle.js";

/** A rule a reward cycle must pass. Check returns its problems, or none. */
export interface RewardCycleRule {
  check(item: RewardCycle): string[];
}

export class RewardCycleRequiredTimezoneRule implements RewardCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardCycle): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class RewardCycleTimezoneLengthRule implements RewardCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardCycle): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardCycleRequiredCodeRule implements RewardCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RewardCycleLabelLengthRule implements RewardCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardCycle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward cycle. */
export class RewardCycleValidator {
  rules: RewardCycleRule[];

  constructor(rules: RewardCycleRule[]) {
    this.rules = rules;
  }

  validate(item: RewardCycle): string[] {
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

  requireValid(item: RewardCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardCycle[]): Map<string, string[]> {
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

export function defaultRewardCycleValidator(): RewardCycleValidator {
  return new RewardCycleValidator(
    [
      new RewardCycleRequiredTimezoneRule("reward cycle needs an entry"),
      new RewardCycleTimezoneLengthRule(3600),
      new RewardCycleRequiredCodeRule("reward cycle needs an entry"),
      new RewardCycleLabelLengthRule(120),
    ],
  );
}
