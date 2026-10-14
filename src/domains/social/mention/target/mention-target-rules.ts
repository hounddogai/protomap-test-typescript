import * as text from "../../../../kit/text.js";
import { MentionTarget } from "./mention-target.js";

/** A rule a mention target must pass. Check returns its problems, or none. */
export interface MentionTargetRule {
  check(item: MentionTarget): string[];
}

export class MentionTargetRetriesRangeRule implements MentionTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionTarget): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MentionTargetBudgetRangeRule implements MentionTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionTarget): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MentionTargetAllowedChannelRule implements MentionTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MentionTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is expired`];
    return [];
  }
}

/** Runs every rule of a mention target. */
export class MentionTargetValidator {
  rules: MentionTargetRule[];

  constructor(rules: MentionTargetRule[]) {
    this.rules = rules;
  }

  validate(item: MentionTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionTarget[]): Map<string, string[]> {
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

export function defaultMentionTargetValidator(): MentionTargetValidator {
  return new MentionTargetValidator(
    [
      new MentionTargetRetriesRangeRule(64, 120),
      new MentionTargetBudgetRangeRule(4.3, 3600.4),
      new MentionTargetAllowedChannelRule([]),
    ],
  );
}
