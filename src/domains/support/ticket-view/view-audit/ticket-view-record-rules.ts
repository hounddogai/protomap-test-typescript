import { TicketViewRecord } from "./ticket-view-record.js";

/** A rule a ticket view record must pass. Check returns its problems, or none. */
export interface TicketViewRecordRule {
  check(item: TicketViewRecord): string[];
}

export class TicketViewRecordFrequencyCapRangeRule implements TicketViewRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewRecord): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TicketViewRecordMaximumRangeRule implements TicketViewRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewRecord): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewRecordChannelLengthRule implements TicketViewRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewRecord): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a ticket view record. */
export class TicketViewRecordValidator {
  rules: TicketViewRecordRule[];

  constructor(rules: TicketViewRecordRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewRecord[]): Map<string, string[]> {
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

export function defaultTicketViewRecordValidator(): TicketViewRecordValidator {
  return new TicketViewRecordValidator(
    [
      new TicketViewRecordFrequencyCapRangeRule(16, 1000),
      new TicketViewRecordMaximumRangeRule(4.7, 3286.6),
      new TicketViewRecordChannelLengthRule(64),
    ],
  );
}
