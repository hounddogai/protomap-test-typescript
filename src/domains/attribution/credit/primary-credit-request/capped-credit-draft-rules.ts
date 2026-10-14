import { CappedCreditDraft } from "./capped-credit-draft.js";

/** A rule a capped credit draft must pass. Check returns its problems, or none. */
export interface CappedCreditDraftRule {
  check(item: CappedCreditDraft): string[];
}

export class CappedCreditDraftRequiredCodeRule implements CappedCreditDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCreditDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCreditDraftCapacityRangeRule implements CappedCreditDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedCreditDraft): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedCreditDraftCodeLengthRule implements CappedCreditDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedCreditDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped credit draft. */
export class CappedCreditDraftValidator {
  rules: CappedCreditDraftRule[];

  constructor(rules: CappedCreditDraftRule[]) {
    this.rules = rules;
  }

  validate(item: CappedCreditDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedCreditDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedCreditDraft[]): Map<string, string[]> {
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

export function defaultCappedCreditDraftValidator(): CappedCreditDraftValidator {
  return new CappedCreditDraftValidator(
    [
      new CappedCreditDraftRequiredCodeRule("capped credit draft needs this field"),
      new CappedCreditDraftCapacityRangeRule(16, 16),
      new CappedCreditDraftCodeLengthRule(16),
    ],
  );
}
