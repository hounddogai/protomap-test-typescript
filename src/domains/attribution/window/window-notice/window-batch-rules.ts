import { WindowBatch } from "./window-batch.js";

/** A rule a window batch must pass. Check returns its problems, or none. */
export interface WindowBatchRule {
  check(item: WindowBatch): string[];
}

export class WindowBatchMarginRangeRule implements WindowBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowBatch): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WindowBatchLabelLengthRule implements WindowBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowBatch): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowBatchThresholdRangeRule implements WindowBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowBatch): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WindowBatchRequiredLabelRule implements WindowBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowBatch): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WindowBatchCodePrefixRule implements WindowBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WindowBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WindowBatchCodeLengthRule implements WindowBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a window batch. */
export class WindowBatchValidator {
  rules: WindowBatchRule[];

  constructor(rules: WindowBatchRule[]) {
    this.rules = rules;
  }

  validate(item: WindowBatch): string[] {
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

  requireValid(item: WindowBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowBatch[]): Map<string, string[]> {
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

export function defaultWindowBatchValidator(): WindowBatchValidator {
  return new WindowBatchValidator(
    [
      new WindowBatchMarginRangeRule(0.1, 2144),
      new WindowBatchLabelLengthRule(1000),
      new WindowBatchThresholdRangeRule(8.8, 2145.5),
      new WindowBatchRequiredLabelRule("window batch needs this field"),
      new WindowBatchCodePrefixRule("Q"),
      new WindowBatchCodeLengthRule(80),
    ],
  );
}
