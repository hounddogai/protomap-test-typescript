import * as text from "../../../../kit/text.js";
import { FallbackQueueAdjustment } from "./fallback-queue-adjustment.js";

/** A rule a fallback queue adjustment must pass. Check returns its problems, or none. */
export interface FallbackQueueAdjustmentRule {
  check(item: FallbackQueueAdjustment): string[];
}

export class FallbackQueueAdjustmentCurrencyLengthRule implements FallbackQueueAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackQueueAdjustment): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackQueueAdjustmentAllowedCurrencyRule implements FallbackQueueAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackQueueAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is blocked`];
    return [];
  }
}

export class FallbackQueueAdjustmentFrequencyCapRangeRule implements FallbackQueueAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackQueueAdjustment): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackQueueAdjustmentRequiredCurrencyRule implements FallbackQueueAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackQueueAdjustment): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackQueueAdjustmentLocaleLengthRule implements FallbackQueueAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackQueueAdjustment): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback queue adjustment. */
export class FallbackQueueAdjustmentValidator {
  rules: FallbackQueueAdjustmentRule[];

  constructor(rules: FallbackQueueAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackQueueAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackQueueAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackQueueAdjustment[]): Map<string, string[]> {
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

export function defaultFallbackQueueAdjustmentValidator(): FallbackQueueAdjustmentValidator {
  return new FallbackQueueAdjustmentValidator(
    [
      new FallbackQueueAdjustmentCurrencyLengthRule(255),
      new FallbackQueueAdjustmentAllowedCurrencyRule(["rolling", "capped", "batched"]),
      new FallbackQueueAdjustmentFrequencyCapRangeRule(120, 86400),
      new FallbackQueueAdjustmentRequiredCurrencyRule("fallback queue adjustment needs an entry"),
      new FallbackQueueAdjustmentLocaleLengthRule(120),
    ],
  );
}
