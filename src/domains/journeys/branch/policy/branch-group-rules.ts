import { BranchGroup } from "./branch-group.js";

/** A rule a branch group must pass. Check returns its problems, or none. */
export interface BranchGroupRule {
  check(item: BranchGroup): string[];
}

export class BranchGroupRequiredCodeRule implements BranchGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BranchGroupCodeLengthRule implements BranchGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchGroupSendAtRangeRule implements BranchGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchGroup): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BranchGroupDurationMinutesRangeRule implements BranchGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchGroup): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BranchGroupBudgetRangeRule implements BranchGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchGroup): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a branch group. */
export class BranchGroupValidator {
  rules: BranchGroupRule[];

  constructor(rules: BranchGroupRule[]) {
    this.rules = rules;
  }

  validate(item: BranchGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BranchGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchGroup[]): Map<string, string[]> {
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

export function defaultBranchGroupValidator(): BranchGroupValidator {
  return new BranchGroupValidator(
    [
      new BranchGroupRequiredCodeRule("branch group needs a value"),
      new BranchGroupCodeLengthRule(3600),
      new BranchGroupSendAtRangeRule(32, 86400),
      new BranchGroupDurationMinutesRangeRule(16, 64),
      new BranchGroupBudgetRangeRule(4.7, 2948),
    ],
  );
}
