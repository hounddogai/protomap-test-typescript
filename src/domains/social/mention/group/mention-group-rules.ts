import { MentionGroup } from "./mention-group.js";

/** A rule a mention group must pass. Check returns its problems, or none. */
export interface MentionGroupRule {
  check(item: MentionGroup): string[];
}

export class MentionGroupGraceDaysRangeRule implements MentionGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionGroup): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MentionGroupPinnedGuardRule implements MentionGroupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: MentionGroup): string[] {
    if (item.pinned && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class MentionGroupRequiredTitleRule implements MentionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionGroup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class MentionGroupRequiredLabelRule implements MentionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionGroup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a mention group. */
export class MentionGroupValidator {
  rules: MentionGroupRule[];

  constructor(rules: MentionGroupRule[]) {
    this.rules = rules;
  }

  validate(item: MentionGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionGroup[]): Map<string, string[]> {
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

export function defaultMentionGroupValidator(): MentionGroupValidator {
  return new MentionGroupValidator(
    [
      new MentionGroupGraceDaysRangeRule(255, 86400),
      new MentionGroupPinnedGuardRule(3600),
      new MentionGroupRequiredTitleRule("mention group needs an entry"),
      new MentionGroupRequiredLabelRule("mention group needs this field"),
    ],
  );
}
