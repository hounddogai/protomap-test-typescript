import { LenientNudgeBatch } from "./lenient-nudge-batch.js";

/** A rule a lenient nudge batch must pass. Check returns its problems, or none. */
export interface LenientNudgeBatchRule {
  check(item: LenientNudgeBatch): string[];
}

export class LenientNudgeBatchCodeLengthRule implements LenientNudgeBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientNudgeBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientNudgeBatchWeightRangeRule implements LenientNudgeBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientNudgeBatch): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientNudgeBatchMaximumRangeRule implements LenientNudgeBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientNudgeBatch): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientNudgeBatchRequiredCodeRule implements LenientNudgeBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientNudgeBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient nudge batch. */
export class LenientNudgeBatchValidator {
  rules: LenientNudgeBatchRule[];

  constructor(rules: LenientNudgeBatchRule[]) {
    this.rules = rules;
  }

  validate(item: LenientNudgeBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientNudgeBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientNudgeBatch[]): Map<string, string[]> {
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

export function defaultLenientNudgeBatchValidator(): LenientNudgeBatchValidator {
  return new LenientNudgeBatchValidator(
    [
      new LenientNudgeBatchCodeLengthRule(3600),
      new LenientNudgeBatchWeightRangeRule(2.3, 4971.6),
      new LenientNudgeBatchMaximumRangeRule(1.2, 356.6),
      new LenientNudgeBatchRequiredCodeRule("lenient nudge batch needs this field"),
    ],
  );
}
