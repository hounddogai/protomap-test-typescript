import { PacingAdjustment } from "./pacing-adjustment.js";

/** A rule a pacing adjustment must pass. Check returns its problems, or none. */
export interface PacingAdjustmentRule {
  check(item: PacingAdjustment): string[];
}

export class PacingAdjustmentRequiredNameRule implements PacingAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingAdjustment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PacingAdjustmentCodeLengthRule implements PacingAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingAdjustmentCodePrefixRule implements PacingAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pacing adjustment. */
export class PacingAdjustmentValidator {
  rules: PacingAdjustmentRule[];

  constructor(rules: PacingAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: PacingAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PacingAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingAdjustment[]): Map<string, string[]> {
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

export function defaultPacingAdjustmentValidator(): PacingAdjustmentValidator {
  return new PacingAdjustmentValidator(
    [
      new PacingAdjustmentRequiredNameRule("pacing adjustment needs a value"),
      new PacingAdjustmentCodeLengthRule(64),
      new PacingAdjustmentCodePrefixRule("REF"),
    ],
  );
}
