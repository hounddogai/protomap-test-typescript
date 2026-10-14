import { ScheduledNudgeThreshold } from "./scheduled-nudge-threshold.js";

/** A rule a scheduled nudge threshold must pass. Check returns its problems, or none. */
export interface ScheduledNudgeThresholdRule {
  check(item: ScheduledNudgeThreshold): string[];
}

export class ScheduledNudgeThresholdRequiredTitleRule implements ScheduledNudgeThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledNudgeThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledNudgeThresholdCodeLengthRule implements ScheduledNudgeThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledNudgeThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledNudgeThresholdCostRangeRule implements ScheduledNudgeThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledNudgeThreshold): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledNudgeThresholdCodePrefixRule implements ScheduledNudgeThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledNudgeThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a scheduled nudge threshold. */
export class ScheduledNudgeThresholdValidator {
  rules: ScheduledNudgeThresholdRule[];

  constructor(rules: ScheduledNudgeThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledNudgeThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledNudgeThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledNudgeThreshold[]): Map<string, string[]> {
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

export function defaultScheduledNudgeThresholdValidator(): ScheduledNudgeThresholdValidator {
  return new ScheduledNudgeThresholdValidator(
    [
      new ScheduledNudgeThresholdRequiredTitleRule("scheduled nudge threshold needs a value"),
      new ScheduledNudgeThresholdCodeLengthRule(255),
      new ScheduledNudgeThresholdCostRangeRule(3.6, 1576.5),
      new ScheduledNudgeThresholdCodePrefixRule("Q"),
    ],
  );
}
