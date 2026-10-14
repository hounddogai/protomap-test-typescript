import { ManualBounceException } from "./manual-bounce-exception.js";

/** A rule a manual bounce exception must pass. Check returns its problems, or none. */
export interface ManualBounceExceptionRule {
  check(item: ManualBounceException): string[];
}

export class ManualBounceExceptionClicksRangeRule implements ManualBounceExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualBounceException): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualBounceExceptionSourceLengthRule implements ManualBounceExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBounceException): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBounceExceptionRequiredCodeRule implements ManualBounceExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBounceException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualBounceExceptionCodeLengthRule implements ManualBounceExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBounceException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBounceExceptionSequenceRangeRule implements ManualBounceExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualBounceException): string[] {
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

/** Runs every rule of a manual bounce exception. */
export class ManualBounceExceptionValidator {
  rules: ManualBounceExceptionRule[];

  constructor(rules: ManualBounceExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: ManualBounceException): string[] {
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

  requireValid(item: ManualBounceException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualBounceException[]): Map<string, string[]> {
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

export function defaultManualBounceExceptionValidator(): ManualBounceExceptionValidator {
  return new ManualBounceExceptionValidator(
    [
      new ManualBounceExceptionClicksRangeRule(120, 255),
      new ManualBounceExceptionSourceLengthRule(32),
      new ManualBounceExceptionRequiredCodeRule("manual bounce exception needs a value"),
      new ManualBounceExceptionCodeLengthRule(64),
      new ManualBounceExceptionSequenceRangeRule(64, 1000),
    ],
  );
}
