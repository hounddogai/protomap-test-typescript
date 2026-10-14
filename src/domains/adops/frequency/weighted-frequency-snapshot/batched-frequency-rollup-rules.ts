import { BatchedFrequencyRollup } from "./batched-frequency-rollup.js";

/** A rule a batched frequency rollup must pass. Check returns its problems, or none. */
export interface BatchedFrequencyRollupRule {
  check(item: BatchedFrequencyRollup): string[];
}

export class BatchedFrequencyRollupRequiredLabelRule implements BatchedFrequencyRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFrequencyRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedFrequencyRollupCodeLengthRule implements BatchedFrequencyRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedFrequencyRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedFrequencyRollupFrequencyCapRangeRule implements BatchedFrequencyRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedFrequencyRollup): string[] {
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

export class BatchedFrequencyRollupOpenRateRangeRule implements BatchedFrequencyRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedFrequencyRollup): string[] {
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

export class BatchedFrequencyRollupRequiredChannelRule implements BatchedFrequencyRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFrequencyRollup): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched frequency rollup. */
export class BatchedFrequencyRollupValidator {
  rules: BatchedFrequencyRollupRule[];

  constructor(rules: BatchedFrequencyRollupRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedFrequencyRollup): string[] {
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

  requireValid(item: BatchedFrequencyRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedFrequencyRollup[]): Map<string, string[]> {
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

export function defaultBatchedFrequencyRollupValidator(): BatchedFrequencyRollupValidator {
  return new BatchedFrequencyRollupValidator(
    [
      new BatchedFrequencyRollupRequiredLabelRule("batched frequency rollup needs an entry"),
      new BatchedFrequencyRollupCodeLengthRule(3600),
      new BatchedFrequencyRollupFrequencyCapRangeRule(80, 3600),
      new BatchedFrequencyRollupOpenRateRangeRule(9.7, 2555.3),
      new BatchedFrequencyRollupRequiredChannelRule("batched frequency rollup needs a value"),
    ],
  );
}
