import { BatchedJourneyMilestone } from "./batched-journey-milestone.js";

/** A rule a batched journey milestone must pass. Check returns its problems, or none. */
export interface BatchedJourneyMilestoneRule {
  check(item: BatchedJourneyMilestone): string[];
}

export class BatchedJourneyMilestoneFloorValueRangeRule implements BatchedJourneyMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedJourneyMilestone): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedJourneyMilestoneExpiresAtRangeRule implements BatchedJourneyMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedJourneyMilestone): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedJourneyMilestoneCodeLengthRule implements BatchedJourneyMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedJourneyMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedJourneyMilestoneRequiredLabelRule implements BatchedJourneyMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedJourneyMilestone): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedJourneyMilestoneSendAtRangeRule implements BatchedJourneyMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedJourneyMilestone): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched journey milestone. */
export class BatchedJourneyMilestoneValidator {
  rules: BatchedJourneyMilestoneRule[];

  constructor(rules: BatchedJourneyMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedJourneyMilestone): string[] {
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

  requireValid(item: BatchedJourneyMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedJourneyMilestone[]): Map<string, string[]> {
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

export function defaultBatchedJourneyMilestoneValidator(): BatchedJourneyMilestoneValidator {
  return new BatchedJourneyMilestoneValidator(
    [
      new BatchedJourneyMilestoneFloorValueRangeRule(4.5, 2314.9),
      new BatchedJourneyMilestoneExpiresAtRangeRule(80, 80),
      new BatchedJourneyMilestoneCodeLengthRule(16),
      new BatchedJourneyMilestoneRequiredLabelRule("batched journey milestone needs an entry"),
      new BatchedJourneyMilestoneSendAtRangeRule(120, 255),
    ],
  );
}
