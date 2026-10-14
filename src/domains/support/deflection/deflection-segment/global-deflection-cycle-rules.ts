import { GlobalDeflectionCycle } from "./global-deflection-cycle.js";

/** A rule a global deflection cycle must pass. Check returns its problems, or none. */
export interface GlobalDeflectionCycleRule {
  check(item: GlobalDeflectionCycle): string[];
}

export class GlobalDeflectionCycleCountryLengthRule implements GlobalDeflectionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalDeflectionCycle): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalDeflectionCycleRequiredCodeRule implements GlobalDeflectionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalDeflectionCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalDeflectionCycleRequiredNameRule implements GlobalDeflectionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalDeflectionCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalDeflectionCyclePriorityRangeRule implements GlobalDeflectionCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalDeflectionCycle): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalDeflectionCycleNameLengthRule implements GlobalDeflectionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalDeflectionCycle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalDeflectionCycleThresholdRangeRule implements GlobalDeflectionCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalDeflectionCycle): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a global deflection cycle. */
export class GlobalDeflectionCycleValidator {
  rules: GlobalDeflectionCycleRule[];

  constructor(rules: GlobalDeflectionCycleRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalDeflectionCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalDeflectionCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalDeflectionCycle[]): Map<string, string[]> {
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

export function defaultGlobalDeflectionCycleValidator(): GlobalDeflectionCycleValidator {
  return new GlobalDeflectionCycleValidator(
    [
      new GlobalDeflectionCycleCountryLengthRule(255),
      new GlobalDeflectionCycleRequiredCodeRule("global deflection cycle needs an entry"),
      new GlobalDeflectionCycleRequiredNameRule("global deflection cycle needs an entry"),
      new GlobalDeflectionCyclePriorityRangeRule(80, 86400),
      new GlobalDeflectionCycleNameLengthRule(3600),
      new GlobalDeflectionCycleThresholdRangeRule(4.9, 2718.8),
    ],
  );
}
