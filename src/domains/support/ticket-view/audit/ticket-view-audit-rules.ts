import { TicketViewAudit } from "./ticket-view-audit.js";

/** A rule a ticket view audit must pass. Check returns its problems, or none. */
export interface TicketViewAuditRule {
  check(item: TicketViewAudit): string[];
}

export class TicketViewAuditCodePrefixRule implements TicketViewAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TicketViewAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TicketViewAuditWindowDaysRangeRule implements TicketViewAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewAudit): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewAuditBidRangeRule implements TicketViewAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewAudit): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TicketViewAuditRequiredTitleRule implements TicketViewAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewAudit): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewAuditFloorValueRangeRule implements TicketViewAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewAudit): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a ticket view audit. */
export class TicketViewAuditValidator {
  rules: TicketViewAuditRule[];

  constructor(rules: TicketViewAuditRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewAudit): string[] {
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

  requireValid(item: TicketViewAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewAudit[]): Map<string, string[]> {
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

export function defaultTicketViewAuditValidator(): TicketViewAuditValidator {
  return new TicketViewAuditValidator(
    [
      new TicketViewAuditCodePrefixRule("Q"),
      new TicketViewAuditWindowDaysRangeRule(120, 255),
      new TicketViewAuditBidRangeRule(9.4, 1003.7),
      new TicketViewAuditRequiredTitleRule("ticket view audit needs a value"),
      new TicketViewAuditFloorValueRangeRule(7.6, 971.8),
    ],
  );
}
