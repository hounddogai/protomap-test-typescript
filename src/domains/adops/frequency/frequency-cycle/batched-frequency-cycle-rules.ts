import * as text from "../../../../kit/text.js";
import { BatchedFrequencyCycle } from "./batched-frequency-cycle.js";

/** A rule a batched frequency cycle must pass. Check returns its problems, or none. */
export interface BatchedFrequencyCycleRule {
  check(item: BatchedFrequencyCycle): string[];
}

export class BatchedFrequencyCycleAllowedLabelRule implements BatchedFrequencyCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedFrequencyCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is expired`];
    return [];
  }
}

export class BatchedFrequencyCycleClicksRangeRule implements BatchedFrequencyCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedFrequencyCycle): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedFrequencyCycleCodePrefixRule implements BatchedFrequencyCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedFrequencyCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedFrequencyCycleRequiredCodeRule implements BatchedFrequencyCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFrequencyCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedFrequencyCycleRevisionRangeRule implements BatchedFrequencyCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedFrequencyCycle): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a batched frequency cycle. */
export class BatchedFrequencyCycleValidator {
  rules: BatchedFrequencyCycleRule[];

  constructor(rules: BatchedFrequencyCycleRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedFrequencyCycle): string[] {
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

  requireValid(item: BatchedFrequencyCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedFrequencyCycle[]): Map<string, string[]> {
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

export function defaultBatchedFrequencyCycleValidator(): BatchedFrequencyCycleValidator {
  return new BatchedFrequencyCycleValidator(
    [
      new BatchedFrequencyCycleAllowedLabelRule(["weighted", "scheduled", "rolling"]),
      new BatchedFrequencyCycleClicksRangeRule(255, 1000),
      new BatchedFrequencyCycleCodePrefixRule("OPS"),
      new BatchedFrequencyCycleRequiredCodeRule("batched frequency cycle needs an entry"),
      new BatchedFrequencyCycleRevisionRangeRule(80, 1000),
    ],
  );
}
