import { StepBatch } from "./step-batch.js";

/** A rule a step batch must pass. Check returns its problems, or none. */
export interface StepBatchRule {
  check(item: StepBatch): string[];
}

export class StepBatchRequiredCountryRule implements StepBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepBatch): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class StepBatchCodeLengthRule implements StepBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepBatchScoreRangeRule implements StepBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepBatch): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StepBatchCapacityRangeRule implements StepBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepBatch): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a step batch. */
export class StepBatchValidator {
  rules: StepBatchRule[];

  constructor(rules: StepBatchRule[]) {
    this.rules = rules;
  }

  validate(item: StepBatch): string[] {
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

  requireValid(item: StepBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepBatch[]): Map<string, string[]> {
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

export function defaultStepBatchValidator(): StepBatchValidator {
  return new StepBatchValidator(
    [
      new StepBatchRequiredCountryRule("step batch needs a value"),
      new StepBatchCodeLengthRule(255),
      new StepBatchScoreRangeRule(5.9, 1072.7),
      new StepBatchCapacityRangeRule(32, 255),
    ],
  );
}
