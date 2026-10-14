import { TicketViewCheckpoint } from "./ticket-view-checkpoint.js";

/** A rule a ticket view checkpoint must pass. Check returns its problems, or none. */
export interface TicketViewCheckpointRule {
  check(item: TicketViewCheckpoint): string[];
}

export class TicketViewCheckpointCodeLengthRule implements TicketViewCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewCheckpointTimezoneLengthRule implements TicketViewCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewCheckpoint): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewCheckpointRequiredCodeRule implements TicketViewCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewCheckpointAttemptsRangeRule implements TicketViewCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewCheckpoint): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewCheckpointRequiredJourneyIdRule implements TicketViewCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewCheckpoint): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewCheckpointApprovedGuardRule implements TicketViewCheckpointRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TicketViewCheckpoint): string[] {
    if (item.approved && item.weight > this.limit) return [`weight ${item.weight} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a ticket view checkpoint. */
export class TicketViewCheckpointValidator {
  rules: TicketViewCheckpointRule[];

  constructor(rules: TicketViewCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewCheckpoint[]): Map<string, string[]> {
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

export function defaultTicketViewCheckpointValidator(): TicketViewCheckpointValidator {
  return new TicketViewCheckpointValidator(
    [
      new TicketViewCheckpointCodeLengthRule(86400),
      new TicketViewCheckpointTimezoneLengthRule(1000),
      new TicketViewCheckpointRequiredCodeRule("ticket view checkpoint needs this field"),
      new TicketViewCheckpointAttemptsRangeRule(80, 1000),
      new TicketViewCheckpointRequiredJourneyIdRule("ticket view checkpoint needs an entry"),
      new TicketViewCheckpointApprovedGuardRule(8),
    ],
  );
}
