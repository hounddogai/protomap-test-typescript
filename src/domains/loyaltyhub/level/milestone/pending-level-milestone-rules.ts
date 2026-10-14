import { PendingLevelMilestone } from "./pending-level-milestone.js";

/** A rule a pending level milestone must pass. Check returns its problems, or none. */
export interface PendingLevelMilestoneRule {
  check(item: PendingLevelMilestone): string[];
}

export class PendingLevelMilestoneEndsAtRangeRule implements PendingLevelMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingLevelMilestone): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingLevelMilestoneRequiredLabelRule implements PendingLevelMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingLevelMilestone): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingLevelMilestoneRequiredUtmSourceRule implements PendingLevelMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingLevelMilestone): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class PendingLevelMilestoneRequiredCodeRule implements PendingLevelMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingLevelMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingLevelMilestoneCodeLengthRule implements PendingLevelMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLevelMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingLevelMilestoneCodePrefixRule implements PendingLevelMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingLevelMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending level milestone. */
export class PendingLevelMilestoneValidator {
  rules: PendingLevelMilestoneRule[];

  constructor(rules: PendingLevelMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: PendingLevelMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingLevelMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingLevelMilestone[]): Map<string, string[]> {
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

export function defaultPendingLevelMilestoneValidator(): PendingLevelMilestoneValidator {
  return new PendingLevelMilestoneValidator(
    [
      new PendingLevelMilestoneEndsAtRangeRule(16, 255),
      new PendingLevelMilestoneRequiredLabelRule("pending level milestone needs a value"),
      new PendingLevelMilestoneRequiredUtmSourceRule("pending level milestone needs this field"),
      new PendingLevelMilestoneRequiredCodeRule("pending level milestone needs an entry"),
      new PendingLevelMilestoneCodeLengthRule(120),
      new PendingLevelMilestoneCodePrefixRule("Q"),
    ],
  );
}
