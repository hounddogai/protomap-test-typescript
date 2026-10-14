import { PacingBaseline } from "./pacing-baseline.js";

/** A rule a pacing baseline must pass. Check returns its problems, or none. */
export interface PacingBaselineRule {
  check(item: PacingBaseline): string[];
}

export class PacingBaselineRequiredDescriptionRule implements PacingBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingBaseline): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class PacingBaselineNotesLengthRule implements PacingBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingBaseline): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingBaselineCodePrefixRule implements PacingBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pacing baseline. */
export class PacingBaselineValidator {
  rules: PacingBaselineRule[];

  constructor(rules: PacingBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: PacingBaseline): string[] {
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

  requireValid(item: PacingBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingBaseline[]): Map<string, string[]> {
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

export function defaultPacingBaselineValidator(): PacingBaselineValidator {
  return new PacingBaselineValidator(
    [
      new PacingBaselineRequiredDescriptionRule("pacing baseline needs this field"),
      new PacingBaselineNotesLengthRule(86400),
      new PacingBaselineCodePrefixRule("OPS"),
    ],
  );
}
