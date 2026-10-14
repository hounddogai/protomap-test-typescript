import { WeightedSenderThreshold } from "./weighted-sender-threshold.js";

/** A rule a weighted sender threshold must pass. Check returns its problems, or none. */
export interface WeightedSenderThresholdRule {
  check(item: WeightedSenderThreshold): string[];
}

export class WeightedSenderThresholdSendAtRangeRule implements WeightedSenderThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedSenderThreshold): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedSenderThresholdRequiredUtmSourceRule implements WeightedSenderThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedSenderThreshold): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedSenderThresholdRequiredTitleRule implements WeightedSenderThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedSenderThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedSenderThresholdGraceDaysRangeRule implements WeightedSenderThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedSenderThreshold): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a weighted sender threshold. */
export class WeightedSenderThresholdValidator {
  rules: WeightedSenderThresholdRule[];

  constructor(rules: WeightedSenderThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedSenderThreshold): string[] {
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

  requireValid(item: WeightedSenderThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedSenderThreshold[]): Map<string, string[]> {
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

export function defaultWeightedSenderThresholdValidator(): WeightedSenderThresholdValidator {
  return new WeightedSenderThresholdValidator(
    [
      new WeightedSenderThresholdSendAtRangeRule(80, 3600),
      new WeightedSenderThresholdRequiredUtmSourceRule("weighted sender threshold needs a value"),
      new WeightedSenderThresholdRequiredTitleRule("weighted sender threshold needs a value"),
      new WeightedSenderThresholdGraceDaysRangeRule(16, 86400),
    ],
  );
}
