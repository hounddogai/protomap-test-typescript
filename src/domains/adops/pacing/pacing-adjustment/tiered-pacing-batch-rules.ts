import { TieredPacingBatch } from "./tiered-pacing-batch.js";

/** A rule a tiered pacing batch must pass. Check returns its problems, or none. */
export interface TieredPacingBatchRule {
  check(item: TieredPacingBatch): string[];
}

export class TieredPacingBatchRequiredPhoneRule implements TieredPacingBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPacingBatch): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPacingBatchScoreRangeRule implements TieredPacingBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPacingBatch): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredPacingBatchRequiredCodeRule implements TieredPacingBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPacingBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered pacing batch. */
export class TieredPacingBatchValidator {
  rules: TieredPacingBatchRule[];

  constructor(rules: TieredPacingBatchRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPacingBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredPacingBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPacingBatch[]): Map<string, string[]> {
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

export function defaultTieredPacingBatchValidator(): TieredPacingBatchValidator {
  return new TieredPacingBatchValidator(
    [
      new TieredPacingBatchRequiredPhoneRule("tiered pacing batch needs a value"),
      new TieredPacingBatchScoreRangeRule(6, 3969),
      new TieredPacingBatchRequiredCodeRule("tiered pacing batch needs this field"),
    ],
  );
}
