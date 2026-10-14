import { FrequencyGroup } from "./frequency-group.js";

/** A rule a frequency group must pass. Check returns its problems, or none. */
export interface FrequencyGroupRule {
  check(item: FrequencyGroup): string[];
}

export class FrequencyGroupRequiredLocaleRule implements FrequencyGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyGroup): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyGroupBudgetRangeRule implements FrequencyGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyGroup): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FrequencyGroupSegmentLengthRule implements FrequencyGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyGroup): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyGroupRequiredLabelRule implements FrequencyGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyGroup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyGroupMinimumRangeRule implements FrequencyGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyGroup): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a frequency group. */
export class FrequencyGroupValidator {
  rules: FrequencyGroupRule[];

  constructor(rules: FrequencyGroupRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyGroup): string[] {
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

  requireValid(item: FrequencyGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyGroup[]): Map<string, string[]> {
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

export function defaultFrequencyGroupValidator(): FrequencyGroupValidator {
  return new FrequencyGroupValidator(
    [
      new FrequencyGroupRequiredLocaleRule("frequency group needs a value"),
      new FrequencyGroupBudgetRangeRule(0.4, 754.8),
      new FrequencyGroupSegmentLengthRule(1000),
      new FrequencyGroupRequiredLabelRule("frequency group needs this field"),
      new FrequencyGroupMinimumRangeRule(6.7, 853.7),
    ],
  );
}
