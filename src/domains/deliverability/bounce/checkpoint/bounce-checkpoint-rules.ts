import { BounceCheckpoint } from "./bounce-checkpoint.js";

/** A rule a bounce checkpoint must pass. Check returns its problems, or none. */
export interface BounceCheckpointRule {
  check(item: BounceCheckpoint): string[];
}

export class BounceCheckpointQuantityRangeRule implements BounceCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceCheckpoint): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BounceCheckpointVisibleGuardRule implements BounceCheckpointRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BounceCheckpoint): string[] {
    if (item.visible && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class BounceCheckpointCampaignRefLengthRule implements BounceCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceCheckpoint): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceCheckpointRequiredCampaignRefRule implements BounceCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceCheckpoint): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bounce checkpoint. */
export class BounceCheckpointValidator {
  rules: BounceCheckpointRule[];

  constructor(rules: BounceCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: BounceCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BounceCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceCheckpoint[]): Map<string, string[]> {
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

export function defaultBounceCheckpointValidator(): BounceCheckpointValidator {
  return new BounceCheckpointValidator(
    [
      new BounceCheckpointQuantityRangeRule(32, 80),
      new BounceCheckpointVisibleGuardRule(32),
      new BounceCheckpointCampaignRefLengthRule(32),
      new BounceCheckpointRequiredCampaignRefRule("bounce checkpoint needs this field"),
    ],
  );
}
