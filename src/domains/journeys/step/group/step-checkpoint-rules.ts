import { StepCheckpoint } from "./step-checkpoint.js";

/** A rule a step checkpoint must pass. Check returns its problems, or none. */
export interface StepCheckpointRule {
  check(item: StepCheckpoint): string[];
}

export class StepCheckpointRevisionRangeRule implements StepCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepCheckpoint): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StepCheckpointVisibleGuardRule implements StepCheckpointRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StepCheckpoint): string[] {
    if (item.visible && item.revision > this.limit) return [`revision ${item.revision} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class StepCheckpointRequiredCodeRule implements StepCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StepCheckpointCostRangeRule implements StepCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepCheckpoint): string[] {
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

export class StepCheckpointLabelLengthRule implements StepCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepCheckpoint): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepCheckpointCodePrefixRule implements StepCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StepCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a step checkpoint. */
export class StepCheckpointValidator {
  rules: StepCheckpointRule[];

  constructor(rules: StepCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: StepCheckpoint): string[] {
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

  requireValid(item: StepCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepCheckpoint[]): Map<string, string[]> {
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

export function defaultStepCheckpointValidator(): StepCheckpointValidator {
  return new StepCheckpointValidator(
    [
      new StepCheckpointRevisionRangeRule(64, 80),
      new StepCheckpointVisibleGuardRule(3600),
      new StepCheckpointRequiredCodeRule("step checkpoint needs an entry"),
      new StepCheckpointCostRangeRule(3.2, 3202.4),
      new StepCheckpointLabelLengthRule(86400),
      new StepCheckpointCodePrefixRule("ACM"),
    ],
  );
}
