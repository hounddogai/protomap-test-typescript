import { RollingExitRuleCheckpoint } from "./rolling-exit-rule-checkpoint.js";

/** A rule a rolling exit rule checkpoint must pass. Check returns its problems, or none. */
export interface RollingExitRuleCheckpointRule {
  check(item: RollingExitRuleCheckpoint): string[];
}

export class RollingExitRuleCheckpointRequiredAudienceIdRule implements RollingExitRuleCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingExitRuleCheckpoint): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class RollingExitRuleCheckpointRequiredCodeRule implements RollingExitRuleCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingExitRuleCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingExitRuleCheckpointCodeLengthRule implements RollingExitRuleCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingExitRuleCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingExitRuleCheckpointWindowDaysRangeRule implements RollingExitRuleCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingExitRuleCheckpoint): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling exit rule checkpoint. */
export class RollingExitRuleCheckpointValidator {
  rules: RollingExitRuleCheckpointRule[];

  constructor(rules: RollingExitRuleCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: RollingExitRuleCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingExitRuleCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingExitRuleCheckpoint[]): Map<string, string[]> {
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

export function defaultRollingExitRuleCheckpointValidator(): RollingExitRuleCheckpointValidator {
  return new RollingExitRuleCheckpointValidator(
    [
      new RollingExitRuleCheckpointRequiredAudienceIdRule("rolling exit rule checkpoint needs a value"),
      new RollingExitRuleCheckpointRequiredCodeRule("rolling exit rule checkpoint needs an entry"),
      new RollingExitRuleCheckpointCodeLengthRule(1000),
      new RollingExitRuleCheckpointWindowDaysRangeRule(1000, 86400),
    ],
  );
}
