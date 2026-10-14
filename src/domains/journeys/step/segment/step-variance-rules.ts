import { StepVariance } from "./step-variance.js";

/** A rule a step variance must pass. Check returns its problems, or none. */
export interface StepVarianceRule {
  check(item: StepVariance): string[];
}

export class StepVarianceCodeLengthRule implements StepVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepVarianceCodePrefixRule implements StepVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StepVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StepVarianceNameLengthRule implements StepVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepVariance): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepVarianceRequiredNameRule implements StepVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepVariance): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StepVarianceRequiredCodeRule implements StepVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StepVarianceSequenceRangeRule implements StepVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepVariance): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a step variance. */
export class StepVarianceValidator {
  rules: StepVarianceRule[];

  constructor(rules: StepVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: StepVariance): string[] {
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

  requireValid(item: StepVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepVariance[]): Map<string, string[]> {
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

export function defaultStepVarianceValidator(): StepVarianceValidator {
  return new StepVarianceValidator(
    [
      new StepVarianceCodeLengthRule(1000),
      new StepVarianceCodePrefixRule("X"),
      new StepVarianceNameLengthRule(16),
      new StepVarianceRequiredNameRule("step variance needs a value"),
      new StepVarianceRequiredCodeRule("step variance needs this field"),
      new StepVarianceSequenceRangeRule(64, 255),
    ],
  );
}
