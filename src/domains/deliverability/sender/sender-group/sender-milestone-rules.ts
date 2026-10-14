import { SenderMilestone } from "./sender-milestone.js";

/** A rule a sender milestone must pass. Check returns its problems, or none. */
export interface SenderMilestoneRule {
  check(item: SenderMilestone): string[];
}

export class SenderMilestoneCodeLengthRule implements SenderMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderMilestoneRequiredCodeRule implements SenderMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SenderMilestoneArchivedGuardRule implements SenderMilestoneRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SenderMilestone): string[] {
    if (item.archived && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class SenderMilestoneAttemptsRangeRule implements SenderMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderMilestone): string[] {
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

/** Runs every rule of a sender milestone. */
export class SenderMilestoneValidator {
  rules: SenderMilestoneRule[];

  constructor(rules: SenderMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: SenderMilestone): string[] {
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

  requireValid(item: SenderMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderMilestone[]): Map<string, string[]> {
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

export function defaultSenderMilestoneValidator(): SenderMilestoneValidator {
  return new SenderMilestoneValidator(
    [
      new SenderMilestoneCodeLengthRule(80),
      new SenderMilestoneRequiredCodeRule("sender milestone needs this field"),
      new SenderMilestoneArchivedGuardRule(16),
      new SenderMilestoneAttemptsRangeRule(16, 86400),
    ],
  );
}
