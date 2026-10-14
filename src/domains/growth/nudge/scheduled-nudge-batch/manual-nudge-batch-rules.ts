import { ManualNudgeBatch } from "./manual-nudge-batch.js";

/** A rule a manual nudge batch must pass. Check returns its problems, or none. */
export interface ManualNudgeBatchRule {
  check(item: ManualNudgeBatch): string[];
}

export class ManualNudgeBatchCountryLengthRule implements ManualNudgeBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualNudgeBatch): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualNudgeBatchRequiredTimezoneRule implements ManualNudgeBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualNudgeBatch): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class ManualNudgeBatchLabelLengthRule implements ManualNudgeBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualNudgeBatch): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualNudgeBatchTimezoneLengthRule implements ManualNudgeBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualNudgeBatch): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualNudgeBatchRequiredCountryRule implements ManualNudgeBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualNudgeBatch): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual nudge batch. */
export class ManualNudgeBatchValidator {
  rules: ManualNudgeBatchRule[];

  constructor(rules: ManualNudgeBatchRule[]) {
    this.rules = rules;
  }

  validate(item: ManualNudgeBatch): string[] {
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

  requireValid(item: ManualNudgeBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualNudgeBatch[]): Map<string, string[]> {
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

export function defaultManualNudgeBatchValidator(): ManualNudgeBatchValidator {
  return new ManualNudgeBatchValidator(
    [
      new ManualNudgeBatchCountryLengthRule(32),
      new ManualNudgeBatchRequiredTimezoneRule("manual nudge batch needs a value"),
      new ManualNudgeBatchLabelLengthRule(80),
      new ManualNudgeBatchTimezoneLengthRule(1000),
      new ManualNudgeBatchRequiredCountryRule("manual nudge batch needs this field"),
    ],
  );
}
