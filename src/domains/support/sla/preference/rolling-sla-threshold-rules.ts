import { RollingSlaThreshold } from "./rolling-sla-threshold.js";

/** A rule a rolling sla threshold must pass. Check returns its problems, or none. */
export interface RollingSlaThresholdRule {
  check(item: RollingSlaThreshold): string[];
}

export class RollingSlaThresholdAmountRangeRule implements RollingSlaThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingSlaThreshold): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingSlaThresholdTitleLengthRule implements RollingSlaThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingSlaThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingSlaThresholdCreatedAtRangeRule implements RollingSlaThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingSlaThreshold): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingSlaThresholdRequiredTitleRule implements RollingSlaThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSlaThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingSlaThresholdRequiredCategoryRule implements RollingSlaThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSlaThreshold): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling sla threshold. */
export class RollingSlaThresholdValidator {
  rules: RollingSlaThresholdRule[];

  constructor(rules: RollingSlaThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: RollingSlaThreshold): string[] {
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

  requireValid(item: RollingSlaThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingSlaThreshold[]): Map<string, string[]> {
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

export function defaultRollingSlaThresholdValidator(): RollingSlaThresholdValidator {
  return new RollingSlaThresholdValidator(
    [
      new RollingSlaThresholdAmountRangeRule(3.9, 2231.7),
      new RollingSlaThresholdTitleLengthRule(1000),
      new RollingSlaThresholdCreatedAtRangeRule(16, 255),
      new RollingSlaThresholdRequiredTitleRule("rolling sla threshold needs an entry"),
      new RollingSlaThresholdRequiredCategoryRule("rolling sla threshold needs a value"),
    ],
  );
}
