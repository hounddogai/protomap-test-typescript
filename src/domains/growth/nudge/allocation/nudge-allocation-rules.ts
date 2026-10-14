import { NudgeAllocation } from "./nudge-allocation.js";

/** A rule a nudge allocation must pass. Check returns its problems, or none. */
export interface NudgeAllocationRule {
  check(item: NudgeAllocation): string[];
}

export class NudgeAllocationNameLengthRule implements NudgeAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeAllocation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeAllocationBudgetRangeRule implements NudgeAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeAllocation): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class NudgeAllocationCodePrefixRule implements NudgeAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: NudgeAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class NudgeAllocationRequiredNameRule implements NudgeAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeAllocation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeAllocationRequiredNotesRule implements NudgeAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeAllocation): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeAllocationRequiredCodeRule implements NudgeAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a nudge allocation. */
export class NudgeAllocationValidator {
  rules: NudgeAllocationRule[];

  constructor(rules: NudgeAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeAllocation[]): Map<string, string[]> {
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

export function defaultNudgeAllocationValidator(): NudgeAllocationValidator {
  return new NudgeAllocationValidator(
    [
      new NudgeAllocationNameLengthRule(1000),
      new NudgeAllocationBudgetRangeRule(0, 4927.7),
      new NudgeAllocationCodePrefixRule("X"),
      new NudgeAllocationRequiredNameRule("nudge allocation needs a value"),
      new NudgeAllocationRequiredNotesRule("nudge allocation needs a value"),
      new NudgeAllocationRequiredCodeRule("nudge allocation needs this field"),
    ],
  );
}
