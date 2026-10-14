import { DefaultEscalationSchedule } from "./default-escalation-schedule.js";

/** A rule a default escalation schedule must pass. Check returns its problems, or none. */
export interface DefaultEscalationScheduleRule {
  check(item: DefaultEscalationSchedule): string[];
}

export class DefaultEscalationScheduleChannelLengthRule implements DefaultEscalationScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultEscalationSchedule): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultEscalationScheduleBatchSizeRangeRule implements DefaultEscalationScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultEscalationSchedule): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultEscalationScheduleRequiredChannelRule implements DefaultEscalationScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultEscalationSchedule): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default escalation schedule. */
export class DefaultEscalationScheduleValidator {
  rules: DefaultEscalationScheduleRule[];

  constructor(rules: DefaultEscalationScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultEscalationSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultEscalationSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultEscalationSchedule[]): Map<string, string[]> {
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

export function defaultDefaultEscalationScheduleValidator(): DefaultEscalationScheduleValidator {
  return new DefaultEscalationScheduleValidator(
    [
      new DefaultEscalationScheduleChannelLengthRule(255),
      new DefaultEscalationScheduleBatchSizeRangeRule(255, 1000),
      new DefaultEscalationScheduleRequiredChannelRule("default escalation schedule needs an entry"),
    ],
  );
}
