import { BatchedMacroScore } from "./batched-macro-score.js";

/** A rule a batched macro score must pass. Check returns its problems, or none. */
export interface BatchedMacroScoreRule {
  check(item: BatchedMacroScore): string[];
}

export class BatchedMacroScoreBudgetRangeRule implements BatchedMacroScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedMacroScore): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedMacroScoreThresholdRangeRule implements BatchedMacroScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedMacroScore): string[] {
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

export class BatchedMacroScoreCodeLengthRule implements BatchedMacroScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedMacroScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedMacroScoreCodePrefixRule implements BatchedMacroScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedMacroScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedMacroScoreRequiredCodeRule implements BatchedMacroScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedMacroScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched macro score. */
export class BatchedMacroScoreValidator {
  rules: BatchedMacroScoreRule[];

  constructor(rules: BatchedMacroScoreRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedMacroScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedMacroScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedMacroScore[]): Map<string, string[]> {
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

export function defaultBatchedMacroScoreValidator(): BatchedMacroScoreValidator {
  return new BatchedMacroScoreValidator(
    [
      new BatchedMacroScoreBudgetRangeRule(2.5, 2101.7),
      new BatchedMacroScoreThresholdRangeRule(2.1, 2112.3),
      new BatchedMacroScoreCodeLengthRule(80),
      new BatchedMacroScoreCodePrefixRule("X"),
      new BatchedMacroScoreRequiredCodeRule("batched macro score needs an entry"),
    ],
  );
}
