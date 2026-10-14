import { CohortAdjustment } from "./cohort-adjustment.js";

/** A rule a cohort adjustment must pass. Check returns its problems, or none. */
export interface CohortAdjustmentRule {
  check(item: CohortAdjustment): string[];
}

export class CohortAdjustmentRevisionRangeRule implements CohortAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortAdjustment): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortAdjustmentNameLengthRule implements CohortAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortAdjustment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortAdjustmentRequiredNameRule implements CohortAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortAdjustment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CohortAdjustmentOpenRateRangeRule implements CohortAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortAdjustment): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortAdjustmentCodeLengthRule implements CohortAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a cohort adjustment. */
export class CohortAdjustmentValidator {
  rules: CohortAdjustmentRule[];

  constructor(rules: CohortAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: CohortAdjustment): string[] {
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

  requireValid(item: CohortAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortAdjustment[]): Map<string, string[]> {
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

export function defaultCohortAdjustmentValidator(): CohortAdjustmentValidator {
  return new CohortAdjustmentValidator(
    [
      new CohortAdjustmentRevisionRangeRule(32, 64),
      new CohortAdjustmentNameLengthRule(64),
      new CohortAdjustmentRequiredNameRule("cohort adjustment needs a value"),
      new CohortAdjustmentOpenRateRangeRule(9.6, 4960.4),
      new CohortAdjustmentCodeLengthRule(86400),
    ],
  );
}
