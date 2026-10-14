import { TicketViewSnapshot } from "./ticket-view-snapshot.js";

/** A rule a ticket view snapshot must pass. Check returns its problems, or none. */
export interface TicketViewSnapshotRule {
  check(item: TicketViewSnapshot): string[];
}

export class TicketViewSnapshotFloorValueRangeRule implements TicketViewSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewSnapshot): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TicketViewSnapshotRequiredLabelRule implements TicketViewSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewSnapshot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewSnapshotRequiredCohortRule implements TicketViewSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewSnapshot): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewSnapshotCodeLengthRule implements TicketViewSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewSnapshotUtmSourceLengthRule implements TicketViewSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewSnapshot): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a ticket view snapshot. */
export class TicketViewSnapshotValidator {
  rules: TicketViewSnapshotRule[];

  constructor(rules: TicketViewSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewSnapshot[]): Map<string, string[]> {
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

export function defaultTicketViewSnapshotValidator(): TicketViewSnapshotValidator {
  return new TicketViewSnapshotValidator(
    [
      new TicketViewSnapshotFloorValueRangeRule(6.7, 1692.9),
      new TicketViewSnapshotRequiredLabelRule("ticket view snapshot needs a value"),
      new TicketViewSnapshotRequiredCohortRule("ticket view snapshot needs an entry"),
      new TicketViewSnapshotCodeLengthRule(3600),
      new TicketViewSnapshotUtmSourceLengthRule(86400),
    ],
  );
}
