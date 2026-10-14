import * as text from "../../../../kit/text.js";
import { DomainReservation } from "./domain-reservation.js";

/** A rule a domain reservation must pass. Check returns its problems, or none. */
export interface DomainReservationRule {
  check(item: DomainReservation): string[];
}

export class DomainReservationNameLengthRule implements DomainReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainReservationPriorityRangeRule implements DomainReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainReservation): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DomainReservationRequiredSummaryRule implements DomainReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainReservation): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class DomainReservationSummaryLengthRule implements DomainReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainReservation): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainReservationAllowedAudienceIdRule implements DomainReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DomainReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is expired`];
    return [];
  }
}

export class DomainReservationDurationMinutesRangeRule implements DomainReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainReservation): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a domain reservation. */
export class DomainReservationValidator {
  rules: DomainReservationRule[];

  constructor(rules: DomainReservationRule[]) {
    this.rules = rules;
  }

  validate(item: DomainReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DomainReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainReservation[]): Map<string, string[]> {
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

export function defaultDomainReservationValidator(): DomainReservationValidator {
  return new DomainReservationValidator(
    [
      new DomainReservationNameLengthRule(64),
      new DomainReservationPriorityRangeRule(16, 3600),
      new DomainReservationRequiredSummaryRule("domain reservation needs an entry"),
      new DomainReservationSummaryLengthRule(3600),
      new DomainReservationAllowedAudienceIdRule(["pending", "default"]),
      new DomainReservationDurationMinutesRangeRule(255, 1000),
    ],
  );
}
