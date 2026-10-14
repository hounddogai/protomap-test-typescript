import { StrictDomainSchedule } from "./strict-domain-schedule.js";

/** A rule a strict domain schedule must pass. Check returns its problems, or none. */
export interface StrictDomainScheduleRule {
  check(item: StrictDomainSchedule): string[];
}

export class StrictDomainScheduleCodeLengthRule implements StrictDomainScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictDomainSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictDomainScheduleSourceLengthRule implements StrictDomainScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictDomainSchedule): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictDomainScheduleJourneyIdLengthRule implements StrictDomainScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictDomainSchedule): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictDomainScheduleApprovedGuardRule implements StrictDomainScheduleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictDomainSchedule): string[] {
    if (item.approved && item.sendAt > this.limit) return [`send at ${item.sendAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class StrictDomainScheduleRequiredSourceRule implements StrictDomainScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictDomainSchedule): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class StrictDomainScheduleCodePrefixRule implements StrictDomainScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictDomainSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict domain schedule. */
export class StrictDomainScheduleValidator {
  rules: StrictDomainScheduleRule[];

  constructor(rules: StrictDomainScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: StrictDomainSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictDomainSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictDomainSchedule[]): Map<string, string[]> {
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

export function defaultStrictDomainScheduleValidator(): StrictDomainScheduleValidator {
  return new StrictDomainScheduleValidator(
    [
      new StrictDomainScheduleCodeLengthRule(1000),
      new StrictDomainScheduleSourceLengthRule(3600),
      new StrictDomainScheduleJourneyIdLengthRule(3600),
      new StrictDomainScheduleApprovedGuardRule(64),
      new StrictDomainScheduleRequiredSourceRule("strict domain schedule needs this field"),
      new StrictDomainScheduleCodePrefixRule("X"),
    ],
  );
}
