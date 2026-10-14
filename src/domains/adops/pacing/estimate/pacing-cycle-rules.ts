import { PacingCycle } from "./pacing-cycle.js";

/** A rule a pacing cycle must pass. Check returns its problems, or none. */
export interface PacingCycleRule {
  check(item: PacingCycle): string[];
}

export class PacingCycleRequiredLocaleRule implements PacingCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingCycle): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PacingCycleLocaleLengthRule implements PacingCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingCycle): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingCycleLabelLengthRule implements PacingCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingCycle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pacing cycle. */
export class PacingCycleValidator {
  rules: PacingCycleRule[];

  constructor(rules: PacingCycleRule[]) {
    this.rules = rules;
  }

  validate(item: PacingCycle): string[] {
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

  requireValid(item: PacingCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingCycle[]): Map<string, string[]> {
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

export function defaultPacingCycleValidator(): PacingCycleValidator {
  return new PacingCycleValidator(
    [
      new PacingCycleRequiredLocaleRule("pacing cycle needs this field"),
      new PacingCycleLocaleLengthRule(255),
      new PacingCycleLabelLengthRule(3600),
    ],
  );
}
