import { GlobalComplaintCycle } from "./global-complaint-cycle.js";

/** A rule a global complaint cycle must pass. Check returns its problems, or none. */
export interface GlobalComplaintCycleRule {
  check(item: GlobalComplaintCycle): string[];
}

export class GlobalComplaintCycleCostRangeRule implements GlobalComplaintCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalComplaintCycle): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalComplaintCycleRateRangeRule implements GlobalComplaintCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalComplaintCycle): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalComplaintCycleJourneyIdLengthRule implements GlobalComplaintCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalComplaintCycle): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalComplaintCycleNameLengthRule implements GlobalComplaintCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalComplaintCycle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalComplaintCycleCodeLengthRule implements GlobalComplaintCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalComplaintCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalComplaintCycleRequiredNameRule implements GlobalComplaintCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalComplaintCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global complaint cycle. */
export class GlobalComplaintCycleValidator {
  rules: GlobalComplaintCycleRule[];

  constructor(rules: GlobalComplaintCycleRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalComplaintCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalComplaintCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalComplaintCycle[]): Map<string, string[]> {
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

export function defaultGlobalComplaintCycleValidator(): GlobalComplaintCycleValidator {
  return new GlobalComplaintCycleValidator(
    [
      new GlobalComplaintCycleCostRangeRule(5.8, 1149.8),
      new GlobalComplaintCycleRateRangeRule(3.8, 3600.5),
      new GlobalComplaintCycleJourneyIdLengthRule(3600),
      new GlobalComplaintCycleNameLengthRule(16),
      new GlobalComplaintCycleCodeLengthRule(64),
      new GlobalComplaintCycleRequiredNameRule("global complaint cycle needs an entry"),
    ],
  );
}
