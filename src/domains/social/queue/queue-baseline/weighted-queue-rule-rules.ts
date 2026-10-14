import { WeightedQueueRule } from "./weighted-queue-rule.js";

/** A rule a weighted queue rule must pass. Check returns its problems, or none. */
export interface WeightedQueueRuleRule {
  check(item: WeightedQueueRule): string[];
}

export class WeightedQueueRuleQuantityRangeRule implements WeightedQueueRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedQueueRule): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedQueueRuleTimezoneLengthRule implements WeightedQueueRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedQueueRule): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedQueueRuleTitleLengthRule implements WeightedQueueRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedQueueRule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedQueueRuleOwnerIdLengthRule implements WeightedQueueRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedQueueRule): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedQueueRuleRequiredTitleRule implements WeightedQueueRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedQueueRule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted queue rule. */
export class WeightedQueueRuleValidator {
  rules: WeightedQueueRuleRule[];

  constructor(rules: WeightedQueueRuleRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedQueueRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedQueueRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedQueueRule[]): Map<string, string[]> {
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

export function defaultWeightedQueueRuleValidator(): WeightedQueueRuleValidator {
  return new WeightedQueueRuleValidator(
    [
      new WeightedQueueRuleQuantityRangeRule(255, 1000),
      new WeightedQueueRuleTimezoneLengthRule(32),
      new WeightedQueueRuleTitleLengthRule(64),
      new WeightedQueueRuleOwnerIdLengthRule(1000),
      new WeightedQueueRuleRequiredTitleRule("weighted queue rule needs a value"),
    ],
  );
}
