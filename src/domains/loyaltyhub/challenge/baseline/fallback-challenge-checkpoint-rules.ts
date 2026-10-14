import { FallbackChallengeCheckpoint } from "./fallback-challenge-checkpoint.js";

/** A rule a fallback challenge checkpoint must pass. Check returns its problems, or none. */
export interface FallbackChallengeCheckpointRule {
  check(item: FallbackChallengeCheckpoint): string[];
}

export class FallbackChallengeCheckpointRequiredSegmentRule implements FallbackChallengeCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackChallengeCheckpoint): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackChallengeCheckpointChannelLengthRule implements FallbackChallengeCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackChallengeCheckpoint): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackChallengeCheckpointWeightRangeRule implements FallbackChallengeCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackChallengeCheckpoint): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackChallengeCheckpointRequiredNameRule implements FallbackChallengeCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackChallengeCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackChallengeCheckpointCodeLengthRule implements FallbackChallengeCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackChallengeCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback challenge checkpoint. */
export class FallbackChallengeCheckpointValidator {
  rules: FallbackChallengeCheckpointRule[];

  constructor(rules: FallbackChallengeCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackChallengeCheckpoint): string[] {
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

  requireValid(item: FallbackChallengeCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackChallengeCheckpoint[]): Map<string, string[]> {
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

export function defaultFallbackChallengeCheckpointValidator(): FallbackChallengeCheckpointValidator {
  return new FallbackChallengeCheckpointValidator(
    [
      new FallbackChallengeCheckpointRequiredSegmentRule("fallback challenge checkpoint needs this field"),
      new FallbackChallengeCheckpointChannelLengthRule(1000),
      new FallbackChallengeCheckpointWeightRangeRule(4, 1330),
      new FallbackChallengeCheckpointRequiredNameRule("fallback challenge checkpoint needs an entry"),
      new FallbackChallengeCheckpointCodeLengthRule(64),
    ],
  );
}
