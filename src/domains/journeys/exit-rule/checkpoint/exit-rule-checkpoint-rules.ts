import { ExitRuleCheckpoint } from "./exit-rule-checkpoint.js";

/** A rule a exit rule checkpoint must pass. Check returns its problems, or none. */
export interface ExitRuleCheckpointRule {
  check(item: ExitRuleCheckpoint): string[];
}

export class ExitRuleCheckpointVersionRangeRule implements ExitRuleCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleCheckpoint): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleCheckpointReviewerLengthRule implements ExitRuleCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleCheckpoint): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleCheckpointRequiredTitleRule implements ExitRuleCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleCheckpoint): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleCheckpointCodeLengthRule implements ExitRuleCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleCheckpointCapacityRangeRule implements ExitRuleCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleCheckpoint): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ExitRuleCheckpointBidRangeRule implements ExitRuleCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleCheckpoint): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a exit rule checkpoint. */
export class ExitRuleCheckpointValidator {
  rules: ExitRuleCheckpointRule[];

  constructor(rules: ExitRuleCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleCheckpoint[]): Map<string, string[]> {
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

export function defaultExitRuleCheckpointValidator(): ExitRuleCheckpointValidator {
  return new ExitRuleCheckpointValidator(
    [
      new ExitRuleCheckpointVersionRangeRule(80, 86400),
      new ExitRuleCheckpointReviewerLengthRule(1000),
      new ExitRuleCheckpointRequiredTitleRule("exit rule checkpoint needs a value"),
      new ExitRuleCheckpointCodeLengthRule(86400),
      new ExitRuleCheckpointCapacityRangeRule(3600, 86400),
      new ExitRuleCheckpointBidRangeRule(6, 2901.2),
    ],
  );
}
