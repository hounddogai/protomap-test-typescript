import { StepRequest } from "./step-request.js";

/** A rule a step request must pass. Check returns its problems, or none. */
export interface StepRequestRule {
  check(item: StepRequest): string[];
}

export class StepRequestCategoryLengthRule implements StepRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepRequest): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepRequestRequiredLabelRule implements StepRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepRequest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StepRequestRequiredCodeRule implements StepRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StepRequestStartsAtRangeRule implements StepRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepRequest): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StepRequestLabelLengthRule implements StepRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepRequest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepRequestRequiredCategoryRule implements StepRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepRequest): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a step request. */
export class StepRequestValidator {
  rules: StepRequestRule[];

  constructor(rules: StepRequestRule[]) {
    this.rules = rules;
  }

  validate(item: StepRequest): string[] {
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

  requireValid(item: StepRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepRequest[]): Map<string, string[]> {
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

export function defaultStepRequestValidator(): StepRequestValidator {
  return new StepRequestValidator(
    [
      new StepRequestCategoryLengthRule(16),
      new StepRequestRequiredLabelRule("step request needs this field"),
      new StepRequestRequiredCodeRule("step request needs an entry"),
      new StepRequestStartsAtRangeRule(32, 1000),
      new StepRequestLabelLengthRule(64),
      new StepRequestRequiredCategoryRule("step request needs an entry"),
    ],
  );
}
