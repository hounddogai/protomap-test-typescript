import { RetentionCycle } from "./retention-cycle.js";

/** A rule a retention cycle must pass. Check returns its problems, or none. */
export interface RetentionCycleRule {
  check(item: RetentionCycle): string[];
}

export class RetentionCycleRequiredContactEmailRule implements RetentionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionCycle): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionCycleRequiredNameRule implements RetentionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionCycleSummaryLengthRule implements RetentionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionCycle): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionCycleNameLengthRule implements RetentionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionCycle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionCycleCodeLengthRule implements RetentionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionCycleContactEmailLengthRule implements RetentionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionCycle): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a retention cycle. */
export class RetentionCycleValidator {
  rules: RetentionCycleRule[];

  constructor(rules: RetentionCycleRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionCycle[]): Map<string, string[]> {
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

export function defaultRetentionCycleValidator(): RetentionCycleValidator {
  return new RetentionCycleValidator(
    [
      new RetentionCycleRequiredContactEmailRule("retention cycle needs a value"),
      new RetentionCycleRequiredNameRule("retention cycle needs a value"),
      new RetentionCycleSummaryLengthRule(1000),
      new RetentionCycleNameLengthRule(64),
      new RetentionCycleCodeLengthRule(80),
      new RetentionCycleContactEmailLengthRule(80),
    ],
  );
}
