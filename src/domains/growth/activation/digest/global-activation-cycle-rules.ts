import { GlobalActivationCycle } from "./global-activation-cycle.js";

/** A rule a global activation cycle must pass. Check returns its problems, or none. */
export interface GlobalActivationCycleRule {
  check(item: GlobalActivationCycle): string[];
}

export class GlobalActivationCycleOwnerIdLengthRule implements GlobalActivationCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalActivationCycle): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalActivationCycleEndsAtRangeRule implements GlobalActivationCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalActivationCycle): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalActivationCycleStartsAtRangeRule implements GlobalActivationCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalActivationCycle): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalActivationCycleRequiredReviewerRule implements GlobalActivationCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalActivationCycle): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global activation cycle. */
export class GlobalActivationCycleValidator {
  rules: GlobalActivationCycleRule[];

  constructor(rules: GlobalActivationCycleRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalActivationCycle): string[] {
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

  requireValid(item: GlobalActivationCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalActivationCycle[]): Map<string, string[]> {
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

export function defaultGlobalActivationCycleValidator(): GlobalActivationCycleValidator {
  return new GlobalActivationCycleValidator(
    [
      new GlobalActivationCycleOwnerIdLengthRule(86400),
      new GlobalActivationCycleEndsAtRangeRule(64, 86400),
      new GlobalActivationCycleStartsAtRangeRule(80, 120),
      new GlobalActivationCycleRequiredReviewerRule("global activation cycle needs a value"),
    ],
  );
}
