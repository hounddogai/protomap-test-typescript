import { FallbackQueueThreshold } from "./fallback-queue-threshold.js";

/** A rule a fallback queue threshold must pass. Check returns its problems, or none. */
export interface FallbackQueueThresholdRule {
  check(item: FallbackQueueThreshold): string[];
}

export class FallbackQueueThresholdRequiredCategoryRule implements FallbackQueueThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackQueueThreshold): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackQueueThresholdRequiredLabelRule implements FallbackQueueThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackQueueThreshold): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackQueueThresholdRequiredCodeRule implements FallbackQueueThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackQueueThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackQueueThresholdOpenRateRangeRule implements FallbackQueueThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackQueueThreshold): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackQueueThresholdLabelLengthRule implements FallbackQueueThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackQueueThreshold): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback queue threshold. */
export class FallbackQueueThresholdValidator {
  rules: FallbackQueueThresholdRule[];

  constructor(rules: FallbackQueueThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackQueueThreshold): string[] {
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

  requireValid(item: FallbackQueueThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackQueueThreshold[]): Map<string, string[]> {
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

export function defaultFallbackQueueThresholdValidator(): FallbackQueueThresholdValidator {
  return new FallbackQueueThresholdValidator(
    [
      new FallbackQueueThresholdRequiredCategoryRule("fallback queue threshold needs this field"),
      new FallbackQueueThresholdRequiredLabelRule("fallback queue threshold needs a value"),
      new FallbackQueueThresholdRequiredCodeRule("fallback queue threshold needs this field"),
      new FallbackQueueThresholdOpenRateRangeRule(1.2, 4676.2),
      new FallbackQueueThresholdLabelLengthRule(86400),
    ],
  );
}
