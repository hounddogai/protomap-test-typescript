import { ManualExitRuleMilestone } from "./manual-exit-rule-milestone.js";

/** A rule a manual exit rule milestone must pass. Check returns its problems, or none. */
export interface ManualExitRuleMilestoneRule {
  check(item: ManualExitRuleMilestone): string[];
}

export class ManualExitRuleMilestoneRequiredCodeRule implements ManualExitRuleMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualExitRuleMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualExitRuleMilestoneEndsAtRangeRule implements ManualExitRuleMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualExitRuleMilestone): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualExitRuleMilestoneNameLengthRule implements ManualExitRuleMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualExitRuleMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualExitRuleMilestoneUtmSourceLengthRule implements ManualExitRuleMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualExitRuleMilestone): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual exit rule milestone. */
export class ManualExitRuleMilestoneValidator {
  rules: ManualExitRuleMilestoneRule[];

  constructor(rules: ManualExitRuleMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: ManualExitRuleMilestone): string[] {
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

  requireValid(item: ManualExitRuleMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualExitRuleMilestone[]): Map<string, string[]> {
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

export function defaultManualExitRuleMilestoneValidator(): ManualExitRuleMilestoneValidator {
  return new ManualExitRuleMilestoneValidator(
    [
      new ManualExitRuleMilestoneRequiredCodeRule("manual exit rule milestone needs a value"),
      new ManualExitRuleMilestoneEndsAtRangeRule(3600, 86400),
      new ManualExitRuleMilestoneNameLengthRule(3600),
      new ManualExitRuleMilestoneUtmSourceLengthRule(1000),
    ],
  );
}
