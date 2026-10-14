import { PendingDoubleOptInRollup } from "./pending-double-opt-in-rollup.js";

/** A rule a pending double opt in rollup must pass. Check returns its problems, or none. */
export interface PendingDoubleOptInRollupRule {
  check(item: PendingDoubleOptInRollup): string[];
}

export class PendingDoubleOptInRollupRequiredTitleRule implements PendingDoubleOptInRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingDoubleOptInRollup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingDoubleOptInRollupCohortLengthRule implements PendingDoubleOptInRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingDoubleOptInRollup): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingDoubleOptInRollupCodeLengthRule implements PendingDoubleOptInRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingDoubleOptInRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingDoubleOptInRollupRequiredChecksumRule implements PendingDoubleOptInRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingDoubleOptInRollup): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class PendingDoubleOptInRollupConversionRateRangeRule implements PendingDoubleOptInRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingDoubleOptInRollup): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending double opt in rollup. */
export class PendingDoubleOptInRollupValidator {
  rules: PendingDoubleOptInRollupRule[];

  constructor(rules: PendingDoubleOptInRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PendingDoubleOptInRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingDoubleOptInRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingDoubleOptInRollup[]): Map<string, string[]> {
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

export function defaultPendingDoubleOptInRollupValidator(): PendingDoubleOptInRollupValidator {
  return new PendingDoubleOptInRollupValidator(
    [
      new PendingDoubleOptInRollupRequiredTitleRule("pending double opt in rollup needs an entry"),
      new PendingDoubleOptInRollupCohortLengthRule(64),
      new PendingDoubleOptInRollupCodeLengthRule(255),
      new PendingDoubleOptInRollupRequiredChecksumRule("pending double opt in rollup needs a value"),
      new PendingDoubleOptInRollupConversionRateRangeRule(7, 3756.8),
    ],
  );
}
