import { LenientBranchTarget } from "./lenient-branch-target.js";

/** A rule a lenient branch target must pass. Check returns its problems, or none. */
export interface LenientBranchTargetRule {
  check(item: LenientBranchTarget): string[];
}

export class LenientBranchTargetRequiredPhoneRule implements LenientBranchTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBranchTarget): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class LenientBranchTargetRequiredLabelRule implements LenientBranchTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBranchTarget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientBranchTargetAmountRangeRule implements LenientBranchTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientBranchTarget): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientBranchTargetLabelLengthRule implements LenientBranchTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBranchTarget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient branch target. */
export class LenientBranchTargetValidator {
  rules: LenientBranchTargetRule[];

  constructor(rules: LenientBranchTargetRule[]) {
    this.rules = rules;
  }

  validate(item: LenientBranchTarget): string[] {
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

  requireValid(item: LenientBranchTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientBranchTarget[]): Map<string, string[]> {
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

export function defaultLenientBranchTargetValidator(): LenientBranchTargetValidator {
  return new LenientBranchTargetValidator(
    [
      new LenientBranchTargetRequiredPhoneRule("lenient branch target needs an entry"),
      new LenientBranchTargetRequiredLabelRule("lenient branch target needs a value"),
      new LenientBranchTargetAmountRangeRule(1.5, 1986.7),
      new LenientBranchTargetLabelLengthRule(255),
    ],
  );
}
