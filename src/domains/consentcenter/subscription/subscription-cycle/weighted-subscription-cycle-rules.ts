import { WeightedSubscriptionCycle } from "./weighted-subscription-cycle.js";

/** A rule a weighted subscription cycle must pass. Check returns its problems, or none. */
export interface WeightedSubscriptionCycleRule {
  check(item: WeightedSubscriptionCycle): string[];
}

export class WeightedSubscriptionCycleRequiredSourceRule implements WeightedSubscriptionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedSubscriptionCycle): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedSubscriptionCycleRequiredCohortRule implements WeightedSubscriptionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedSubscriptionCycle): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedSubscriptionCycleRequiredTitleRule implements WeightedSubscriptionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedSubscriptionCycle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedSubscriptionCycleSourceLengthRule implements WeightedSubscriptionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedSubscriptionCycle): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedSubscriptionCycleCohortLengthRule implements WeightedSubscriptionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedSubscriptionCycle): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted subscription cycle. */
export class WeightedSubscriptionCycleValidator {
  rules: WeightedSubscriptionCycleRule[];

  constructor(rules: WeightedSubscriptionCycleRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedSubscriptionCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedSubscriptionCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedSubscriptionCycle[]): Map<string, string[]> {
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

export function defaultWeightedSubscriptionCycleValidator(): WeightedSubscriptionCycleValidator {
  return new WeightedSubscriptionCycleValidator(
    [
      new WeightedSubscriptionCycleRequiredSourceRule("weighted subscription cycle needs this field"),
      new WeightedSubscriptionCycleRequiredCohortRule("weighted subscription cycle needs a value"),
      new WeightedSubscriptionCycleRequiredTitleRule("weighted subscription cycle needs this field"),
      new WeightedSubscriptionCycleSourceLengthRule(64),
      new WeightedSubscriptionCycleCohortLengthRule(3600),
    ],
  );
}
