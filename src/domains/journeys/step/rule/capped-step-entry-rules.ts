import { CappedStepEntry } from "./capped-step-entry.js";

/** A rule a capped step entry must pass. Check returns its problems, or none. */
export interface CappedStepEntryRule {
  check(item: CappedStepEntry): string[];
}

export class CappedStepEntryRequiredCodeRule implements CappedStepEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedStepEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedStepEntryCohortLengthRule implements CappedStepEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedStepEntry): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedStepEntryRequiredLabelRule implements CappedStepEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedStepEntry): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CappedStepEntryQuantityRangeRule implements CappedStepEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedStepEntry): string[] {
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

/** Runs every rule of a capped step entry. */
export class CappedStepEntryValidator {
  rules: CappedStepEntryRule[];

  constructor(rules: CappedStepEntryRule[]) {
    this.rules = rules;
  }

  validate(item: CappedStepEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedStepEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedStepEntry[]): Map<string, string[]> {
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

export function defaultCappedStepEntryValidator(): CappedStepEntryValidator {
  return new CappedStepEntryValidator(
    [
      new CappedStepEntryRequiredCodeRule("capped step entry needs this field"),
      new CappedStepEntryCohortLengthRule(32),
      new CappedStepEntryRequiredLabelRule("capped step entry needs this field"),
      new CappedStepEntryQuantityRangeRule(16, 32),
    ],
  );
}
