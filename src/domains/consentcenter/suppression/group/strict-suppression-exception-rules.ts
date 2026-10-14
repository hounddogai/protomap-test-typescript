import { StrictSuppressionException } from "./strict-suppression-exception.js";

/** A rule a strict suppression exception must pass. Check returns its problems, or none. */
export interface StrictSuppressionExceptionRule {
  check(item: StrictSuppressionException): string[];
}

export class StrictSuppressionExceptionRequiredNotesRule implements StrictSuppressionExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictSuppressionException): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class StrictSuppressionExceptionLocaleLengthRule implements StrictSuppressionExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictSuppressionException): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictSuppressionExceptionRequiredCodeRule implements StrictSuppressionExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictSuppressionException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictSuppressionExceptionSequenceRangeRule implements StrictSuppressionExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictSuppressionException): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a strict suppression exception. */
export class StrictSuppressionExceptionValidator {
  rules: StrictSuppressionExceptionRule[];

  constructor(rules: StrictSuppressionExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: StrictSuppressionException): string[] {
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

  requireValid(item: StrictSuppressionException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictSuppressionException[]): Map<string, string[]> {
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

export function defaultStrictSuppressionExceptionValidator(): StrictSuppressionExceptionValidator {
  return new StrictSuppressionExceptionValidator(
    [
      new StrictSuppressionExceptionRequiredNotesRule("strict suppression exception needs an entry"),
      new StrictSuppressionExceptionLocaleLengthRule(3600),
      new StrictSuppressionExceptionRequiredCodeRule("strict suppression exception needs this field"),
      new StrictSuppressionExceptionSequenceRangeRule(64, 1000),
    ],
  );
}
