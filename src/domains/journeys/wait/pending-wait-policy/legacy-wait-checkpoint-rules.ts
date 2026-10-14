import { LegacyWaitCheckpoint } from "./legacy-wait-checkpoint.js";

/** A rule a legacy wait checkpoint must pass. Check returns its problems, or none. */
export interface LegacyWaitCheckpointRule {
  check(item: LegacyWaitCheckpoint): string[];
}

export class LegacyWaitCheckpointCodePrefixRule implements LegacyWaitCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyWaitCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyWaitCheckpointBudgetRangeRule implements LegacyWaitCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyWaitCheckpoint): string[] {
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

export class LegacyWaitCheckpointLocaleLengthRule implements LegacyWaitCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyWaitCheckpoint): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyWaitCheckpointRequiredCodeRule implements LegacyWaitCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyWaitCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyWaitCheckpointCostRangeRule implements LegacyWaitCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyWaitCheckpoint): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyWaitCheckpointRequiredLabelRule implements LegacyWaitCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyWaitCheckpoint): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy wait checkpoint. */
export class LegacyWaitCheckpointValidator {
  rules: LegacyWaitCheckpointRule[];

  constructor(rules: LegacyWaitCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyWaitCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyWaitCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyWaitCheckpoint[]): Map<string, string[]> {
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

export function defaultLegacyWaitCheckpointValidator(): LegacyWaitCheckpointValidator {
  return new LegacyWaitCheckpointValidator(
    [
      new LegacyWaitCheckpointCodePrefixRule("Q"),
      new LegacyWaitCheckpointBudgetRangeRule(1.3, 2782.8),
      new LegacyWaitCheckpointLocaleLengthRule(80),
      new LegacyWaitCheckpointRequiredCodeRule("legacy wait checkpoint needs a value"),
      new LegacyWaitCheckpointCostRangeRule(6.4, 3331.7),
      new LegacyWaitCheckpointRequiredLabelRule("legacy wait checkpoint needs this field"),
    ],
  );
}
