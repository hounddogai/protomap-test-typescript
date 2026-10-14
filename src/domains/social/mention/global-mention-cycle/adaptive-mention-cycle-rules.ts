import { AdaptiveMentionCycle } from "./adaptive-mention-cycle.js";

/** A rule a adaptive mention cycle must pass. Check returns its problems, or none. */
export interface AdaptiveMentionCycleRule {
  check(item: AdaptiveMentionCycle): string[];
}

export class AdaptiveMentionCycleRequiredCodeRule implements AdaptiveMentionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveMentionCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveMentionCycleBidRangeRule implements AdaptiveMentionCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveMentionCycle): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveMentionCycleJourneyIdLengthRule implements AdaptiveMentionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveMentionCycle): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveMentionCycleRequiredJourneyIdRule implements AdaptiveMentionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveMentionCycle): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive mention cycle. */
export class AdaptiveMentionCycleValidator {
  rules: AdaptiveMentionCycleRule[];

  constructor(rules: AdaptiveMentionCycleRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveMentionCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveMentionCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveMentionCycle[]): Map<string, string[]> {
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

export function defaultAdaptiveMentionCycleValidator(): AdaptiveMentionCycleValidator {
  return new AdaptiveMentionCycleValidator(
    [
      new AdaptiveMentionCycleRequiredCodeRule("adaptive mention cycle needs a value"),
      new AdaptiveMentionCycleBidRangeRule(7.4, 280),
      new AdaptiveMentionCycleJourneyIdLengthRule(255),
      new AdaptiveMentionCycleRequiredJourneyIdRule("adaptive mention cycle needs a value"),
    ],
  );
}
