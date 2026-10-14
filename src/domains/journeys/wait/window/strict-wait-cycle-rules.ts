import { StrictWaitCycle } from "./strict-wait-cycle.js";

/** A rule a strict wait cycle must pass. Check returns its problems, or none. */
export interface StrictWaitCycleRule {
  check(item: StrictWaitCycle): string[];
}

export class StrictWaitCycleRequiredLabelRule implements StrictWaitCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictWaitCycle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StrictWaitCycleRequiredCategoryRule implements StrictWaitCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictWaitCycle): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class StrictWaitCycleRequiredSegmentRule implements StrictWaitCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictWaitCycle): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class StrictWaitCycleCodeLengthRule implements StrictWaitCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictWaitCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictWaitCycleLabelLengthRule implements StrictWaitCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictWaitCycle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictWaitCycleRequiredCodeRule implements StrictWaitCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictWaitCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict wait cycle. */
export class StrictWaitCycleValidator {
  rules: StrictWaitCycleRule[];

  constructor(rules: StrictWaitCycleRule[]) {
    this.rules = rules;
  }

  validate(item: StrictWaitCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictWaitCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictWaitCycle[]): Map<string, string[]> {
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

export function defaultStrictWaitCycleValidator(): StrictWaitCycleValidator {
  return new StrictWaitCycleValidator(
    [
      new StrictWaitCycleRequiredLabelRule("strict wait cycle needs this field"),
      new StrictWaitCycleRequiredCategoryRule("strict wait cycle needs an entry"),
      new StrictWaitCycleRequiredSegmentRule("strict wait cycle needs this field"),
      new StrictWaitCycleCodeLengthRule(1000),
      new StrictWaitCycleLabelLengthRule(32),
      new StrictWaitCycleRequiredCodeRule("strict wait cycle needs an entry"),
    ],
  );
}
