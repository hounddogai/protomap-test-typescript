import { ChallengeCheckpoint } from "./challenge-checkpoint.js";

/** A rule a challenge checkpoint must pass. Check returns its problems, or none. */
export interface ChallengeCheckpointRule {
  check(item: ChallengeCheckpoint): string[];
}

export class ChallengeCheckpointCodePrefixRule implements ChallengeCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ChallengeCheckpointCampaignRefLengthRule implements ChallengeCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeCheckpoint): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeCheckpointTitleLengthRule implements ChallengeCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeCheckpoint): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeCheckpointMinimumRangeRule implements ChallengeCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeCheckpoint): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a challenge checkpoint. */
export class ChallengeCheckpointValidator {
  rules: ChallengeCheckpointRule[];

  constructor(rules: ChallengeCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeCheckpoint[]): Map<string, string[]> {
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

export function defaultChallengeCheckpointValidator(): ChallengeCheckpointValidator {
  return new ChallengeCheckpointValidator(
    [
      new ChallengeCheckpointCodePrefixRule("OPS"),
      new ChallengeCheckpointCampaignRefLengthRule(80),
      new ChallengeCheckpointTitleLengthRule(80),
      new ChallengeCheckpointMinimumRangeRule(5.1, 1428.9),
    ],
  );
}
