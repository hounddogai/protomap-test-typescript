import { PacingException } from "./pacing-exception.js";

/** A rule a pacing exception must pass. Check returns its problems, or none. */
export interface PacingExceptionRule {
  check(item: PacingException): string[];
}

export class PacingExceptionCodePrefixRule implements PacingExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PacingExceptionThresholdRangeRule implements PacingExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingException): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PacingExceptionRequiredCodeRule implements PacingExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pacing exception. */
export class PacingExceptionValidator {
  rules: PacingExceptionRule[];

  constructor(rules: PacingExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: PacingException): string[] {
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

  requireValid(item: PacingException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingException[]): Map<string, string[]> {
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

export function defaultPacingExceptionValidator(): PacingExceptionValidator {
  return new PacingExceptionValidator(
    [
      new PacingExceptionCodePrefixRule("OPS"),
      new PacingExceptionThresholdRangeRule(9.1, 745.6),
      new PacingExceptionRequiredCodeRule("pacing exception needs a value"),
    ],
  );
}
