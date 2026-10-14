import { ScheduledQueueEstimate } from "./scheduled-queue-estimate.js";

/** A rule a scheduled queue estimate must pass. Check returns its problems, or none. */
export interface ScheduledQueueEstimateRule {
  check(item: ScheduledQueueEstimate): string[];
}

export class ScheduledQueueEstimateRatioRangeRule implements ScheduledQueueEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledQueueEstimate): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledQueueEstimateNotesLengthRule implements ScheduledQueueEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledQueueEstimate): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledQueueEstimateRequiredCodeRule implements ScheduledQueueEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledQueueEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledQueueEstimateCodePrefixRule implements ScheduledQueueEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledQueueEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledQueueEstimateRequiredNameRule implements ScheduledQueueEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledQueueEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledQueueEstimateNameLengthRule implements ScheduledQueueEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledQueueEstimate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled queue estimate. */
export class ScheduledQueueEstimateValidator {
  rules: ScheduledQueueEstimateRule[];

  constructor(rules: ScheduledQueueEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledQueueEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledQueueEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledQueueEstimate[]): Map<string, string[]> {
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

export function defaultScheduledQueueEstimateValidator(): ScheduledQueueEstimateValidator {
  return new ScheduledQueueEstimateValidator(
    [
      new ScheduledQueueEstimateRatioRangeRule(2, 3902.4),
      new ScheduledQueueEstimateNotesLengthRule(86400),
      new ScheduledQueueEstimateRequiredCodeRule("scheduled queue estimate needs this field"),
      new ScheduledQueueEstimateCodePrefixRule("Q"),
      new ScheduledQueueEstimateRequiredNameRule("scheduled queue estimate needs this field"),
      new ScheduledQueueEstimateNameLengthRule(120),
    ],
  );
}
