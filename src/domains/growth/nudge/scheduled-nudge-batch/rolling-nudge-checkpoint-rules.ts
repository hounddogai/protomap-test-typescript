import { RollingNudgeCheckpoint } from "./rolling-nudge-checkpoint.js";

/** A rule a rolling nudge checkpoint must pass. Check returns its problems, or none. */
export interface RollingNudgeCheckpointRule {
  check(item: RollingNudgeCheckpoint): string[];
}

export class RollingNudgeCheckpointTagsLimitRule implements RollingNudgeCheckpointRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: RollingNudgeCheckpoint): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class RollingNudgeCheckpointRequiredChecksumRule implements RollingNudgeCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingNudgeCheckpoint): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class RollingNudgeCheckpointMinimumRangeRule implements RollingNudgeCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingNudgeCheckpoint): string[] {
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

export class RollingNudgeCheckpointOpenRateRangeRule implements RollingNudgeCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingNudgeCheckpoint): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingNudgeCheckpointBidRangeRule implements RollingNudgeCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingNudgeCheckpoint): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingNudgeCheckpointRequiredCodeRule implements RollingNudgeCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingNudgeCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling nudge checkpoint. */
export class RollingNudgeCheckpointValidator {
  rules: RollingNudgeCheckpointRule[];

  constructor(rules: RollingNudgeCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: RollingNudgeCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingNudgeCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingNudgeCheckpoint[]): Map<string, string[]> {
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

export function defaultRollingNudgeCheckpointValidator(): RollingNudgeCheckpointValidator {
  return new RollingNudgeCheckpointValidator(
    [
      new RollingNudgeCheckpointTagsLimitRule(32, ["pending", "scheduled", "pending"]),
      new RollingNudgeCheckpointRequiredChecksumRule("rolling nudge checkpoint needs this field"),
      new RollingNudgeCheckpointMinimumRangeRule(3, 2641.6),
      new RollingNudgeCheckpointOpenRateRangeRule(6.2, 3214.8),
      new RollingNudgeCheckpointBidRangeRule(3.9, 3233),
      new RollingNudgeCheckpointRequiredCodeRule("rolling nudge checkpoint needs this field"),
    ],
  );
}
