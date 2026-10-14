import { WaitCycle } from "./wait-cycle.js";

/** A rule a wait cycle must pass. Check returns its problems, or none. */
export interface WaitCycleRule {
  check(item: WaitCycle): string[];
}

export class WaitCycleCodeLengthRule implements WaitCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitCycleRequiredNameRule implements WaitCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WaitCycleCreatedAtRangeRule implements WaitCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitCycle): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitCycleRequiredTitleRule implements WaitCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitCycle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WaitCycleMaximumRangeRule implements WaitCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitCycle): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitCycleJourneyIdLengthRule implements WaitCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitCycle): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a wait cycle. */
export class WaitCycleValidator {
  rules: WaitCycleRule[];

  constructor(rules: WaitCycleRule[]) {
    this.rules = rules;
  }

  validate(item: WaitCycle): string[] {
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

  requireValid(item: WaitCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitCycle[]): Map<string, string[]> {
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

export function defaultWaitCycleValidator(): WaitCycleValidator {
  return new WaitCycleValidator(
    [
      new WaitCycleCodeLengthRule(80),
      new WaitCycleRequiredNameRule("wait cycle needs a value"),
      new WaitCycleCreatedAtRangeRule(64, 64),
      new WaitCycleRequiredTitleRule("wait cycle needs this field"),
      new WaitCycleMaximumRangeRule(7.6, 3874.9),
      new WaitCycleJourneyIdLengthRule(64),
    ],
  );
}
