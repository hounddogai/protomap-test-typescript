import { AdaptiveDomainSchedule } from "./adaptive-domain-schedule.js";

/** A rule a adaptive domain schedule must pass. Check returns its problems, or none. */
export interface AdaptiveDomainScheduleRule {
  check(item: AdaptiveDomainSchedule): string[];
}

export class AdaptiveDomainScheduleCodePrefixRule implements AdaptiveDomainScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveDomainSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveDomainScheduleRequiredNotesRule implements AdaptiveDomainScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveDomainSchedule): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveDomainScheduleRequiredCodeRule implements AdaptiveDomainScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveDomainSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveDomainScheduleScoreRangeRule implements AdaptiveDomainScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveDomainSchedule): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveDomainScheduleApprovedGuardRule implements AdaptiveDomainScheduleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveDomainSchedule): string[] {
    if (item.approved && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class AdaptiveDomainScheduleChannelLengthRule implements AdaptiveDomainScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDomainSchedule): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive domain schedule. */
export class AdaptiveDomainScheduleValidator {
  rules: AdaptiveDomainScheduleRule[];

  constructor(rules: AdaptiveDomainScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveDomainSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveDomainSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveDomainSchedule[]): Map<string, string[]> {
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

export function defaultAdaptiveDomainScheduleValidator(): AdaptiveDomainScheduleValidator {
  return new AdaptiveDomainScheduleValidator(
    [
      new AdaptiveDomainScheduleCodePrefixRule("REF"),
      new AdaptiveDomainScheduleRequiredNotesRule("adaptive domain schedule needs this field"),
      new AdaptiveDomainScheduleRequiredCodeRule("adaptive domain schedule needs this field"),
      new AdaptiveDomainScheduleScoreRangeRule(7, 4986.5),
      new AdaptiveDomainScheduleApprovedGuardRule(8.6),
      new AdaptiveDomainScheduleChannelLengthRule(64),
    ],
  );
}
