import { PrimaryConversionCycle } from "./primary-conversion-cycle.js";

/** A rule a primary conversion cycle must pass. Check returns its problems, or none. */
export interface PrimaryConversionCycleRule {
  check(item: PrimaryConversionCycle): string[];
}

export class PrimaryConversionCycleChannelLengthRule implements PrimaryConversionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryConversionCycle): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryConversionCycleRequiredCodeRule implements PrimaryConversionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryConversionCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryConversionCycleWindowDaysRangeRule implements PrimaryConversionCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryConversionCycle): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryConversionCycleStartsAtRangeRule implements PrimaryConversionCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryConversionCycle): string[] {
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

export class PrimaryConversionCyclePinnedGuardRule implements PrimaryConversionCycleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryConversionCycle): string[] {
    if (item.pinned && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class PrimaryConversionCycleRequiredLabelRule implements PrimaryConversionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryConversionCycle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary conversion cycle. */
export class PrimaryConversionCycleValidator {
  rules: PrimaryConversionCycleRule[];

  constructor(rules: PrimaryConversionCycleRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryConversionCycle): string[] {
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

  requireValid(item: PrimaryConversionCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryConversionCycle[]): Map<string, string[]> {
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

export function defaultPrimaryConversionCycleValidator(): PrimaryConversionCycleValidator {
  return new PrimaryConversionCycleValidator(
    [
      new PrimaryConversionCycleChannelLengthRule(120),
      new PrimaryConversionCycleRequiredCodeRule("primary conversion cycle needs a value"),
      new PrimaryConversionCycleWindowDaysRangeRule(32, 120),
      new PrimaryConversionCycleStartsAtRangeRule(1000, 1000),
      new PrimaryConversionCyclePinnedGuardRule(32),
      new PrimaryConversionCycleRequiredLabelRule("primary conversion cycle needs this field"),
    ],
  );
}
