import { WaitSchedule } from "./wait-schedule.js";

/** A rule a wait schedule must pass. Check returns its problems, or none. */
export interface WaitScheduleRule {
  check(item: WaitSchedule): string[];
}

export class WaitScheduleWeightRangeRule implements WaitScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitSchedule): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WaitScheduleCodePrefixRule implements WaitScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WaitSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WaitScheduleChannelLengthRule implements WaitScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitSchedule): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a wait schedule. */
export class WaitScheduleValidator {
  rules: WaitScheduleRule[];

  constructor(rules: WaitScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: WaitSchedule): string[] {
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

  requireValid(item: WaitSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitSchedule[]): Map<string, string[]> {
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

export function defaultWaitScheduleValidator(): WaitScheduleValidator {
  return new WaitScheduleValidator(
    [
      new WaitScheduleWeightRangeRule(5.7, 1659.5),
      new WaitScheduleCodePrefixRule("ACM"),
      new WaitScheduleChannelLengthRule(86400),
    ],
  );
}
