import { ApprovalCheckpoint } from "./approval-checkpoint.js";

/** A rule a approval checkpoint must pass. Check returns its problems, or none. */
export interface ApprovalCheckpointRule {
  check(item: ApprovalCheckpoint): string[];
}

export class ApprovalCheckpointPriorityRangeRule implements ApprovalCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalCheckpoint): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ApprovalCheckpointRequiredCurrencyRule implements ApprovalCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalCheckpoint): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalCheckpointCurrencyLengthRule implements ApprovalCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalCheckpoint): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalCheckpointSequenceRangeRule implements ApprovalCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalCheckpoint): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ApprovalCheckpointCodeLengthRule implements ApprovalCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalCheckpointRequiredNameRule implements ApprovalCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a approval checkpoint. */
export class ApprovalCheckpointValidator {
  rules: ApprovalCheckpointRule[];

  constructor(rules: ApprovalCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ApprovalCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalCheckpoint[]): Map<string, string[]> {
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

export function defaultApprovalCheckpointValidator(): ApprovalCheckpointValidator {
  return new ApprovalCheckpointValidator(
    [
      new ApprovalCheckpointPriorityRangeRule(64, 80),
      new ApprovalCheckpointRequiredCurrencyRule("approval checkpoint needs a value"),
      new ApprovalCheckpointCurrencyLengthRule(86400),
      new ApprovalCheckpointSequenceRangeRule(64, 86400),
      new ApprovalCheckpointCodeLengthRule(64),
      new ApprovalCheckpointRequiredNameRule("approval checkpoint needs a value"),
    ],
  );
}
