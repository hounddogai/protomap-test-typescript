import { WeightedStreakSummary } from "./weighted-streak-summary.js";

/** A rule a weighted streak summary must pass. Check returns its problems, or none. */
export interface WeightedStreakSummaryRule {
  check(item: WeightedStreakSummary): string[];
}

export class WeightedStreakSummaryPriorityRangeRule implements WeightedStreakSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedStreakSummary): string[] {
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

export class WeightedStreakSummaryCodePrefixRule implements WeightedStreakSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedStreakSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedStreakSummaryRequiredDescriptionRule implements WeightedStreakSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedStreakSummary): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedStreakSummaryOwnerIdLengthRule implements WeightedStreakSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedStreakSummary): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedStreakSummaryStartsAtRangeRule implements WeightedStreakSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedStreakSummary): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted streak summary. */
export class WeightedStreakSummaryValidator {
  rules: WeightedStreakSummaryRule[];

  constructor(rules: WeightedStreakSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedStreakSummary): string[] {
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

  requireValid(item: WeightedStreakSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedStreakSummary[]): Map<string, string[]> {
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

export function defaultWeightedStreakSummaryValidator(): WeightedStreakSummaryValidator {
  return new WeightedStreakSummaryValidator(
    [
      new WeightedStreakSummaryPriorityRangeRule(16, 120),
      new WeightedStreakSummaryCodePrefixRule("OPS"),
      new WeightedStreakSummaryRequiredDescriptionRule("weighted streak summary needs this field"),
      new WeightedStreakSummaryOwnerIdLengthRule(120),
      new WeightedStreakSummaryStartsAtRangeRule(1000, 1000),
    ],
  );
}
