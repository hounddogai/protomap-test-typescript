import * as text from "../../../../kit/text.js";
import { ManualPacingVariance } from "./manual-pacing-variance.js";

/** A rule a manual pacing variance must pass. Check returns its problems, or none. */
export interface ManualPacingVarianceRule {
  check(item: ManualPacingVariance): string[];
}

export class ManualPacingVarianceSequenceRangeRule implements ManualPacingVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPacingVariance): string[] {
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

export class ManualPacingVarianceRequiredCodeRule implements ManualPacingVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPacingVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPacingVarianceAllowedUnitRule implements ManualPacingVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualPacingVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is blocked`];
    return [];
  }
}

export class ManualPacingVarianceRequiredUnitRule implements ManualPacingVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPacingVariance): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPacingVarianceLabelLengthRule implements ManualPacingVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPacingVariance): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual pacing variance. */
export class ManualPacingVarianceValidator {
  rules: ManualPacingVarianceRule[];

  constructor(rules: ManualPacingVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPacingVariance): string[] {
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

  requireValid(item: ManualPacingVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPacingVariance[]): Map<string, string[]> {
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

export function defaultManualPacingVarianceValidator(): ManualPacingVarianceValidator {
  return new ManualPacingVarianceValidator(
    [
      new ManualPacingVarianceSequenceRangeRule(32, 3600),
      new ManualPacingVarianceRequiredCodeRule("manual pacing variance needs this field"),
      new ManualPacingVarianceAllowedUnitRule(["lenient", "adaptive", "tiered"]),
      new ManualPacingVarianceRequiredUnitRule("manual pacing variance needs an entry"),
      new ManualPacingVarianceLabelLengthRule(64),
    ],
  );
}
