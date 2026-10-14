import { TicketViewLedger } from "./ticket-view-ledger.js";

/** A rule a ticket view ledger must pass. Check returns its problems, or none. */
export interface TicketViewLedgerRule {
  check(item: TicketViewLedger): string[];
}

export class TicketViewLedgerRequiredOwnerIdRule implements TicketViewLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewLedger): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewLedgerNameLengthRule implements TicketViewLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewLedger): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewLedgerCodePrefixRule implements TicketViewLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TicketViewLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TicketViewLedgerRequiredCodeRule implements TicketViewLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewLedgerFloorValueRangeRule implements TicketViewLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewLedger): string[] {
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

/** Runs every rule of a ticket view ledger. */
export class TicketViewLedgerValidator {
  rules: TicketViewLedgerRule[];

  constructor(rules: TicketViewLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewLedger): string[] {
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

  requireValid(item: TicketViewLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewLedger[]): Map<string, string[]> {
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

export function defaultTicketViewLedgerValidator(): TicketViewLedgerValidator {
  return new TicketViewLedgerValidator(
    [
      new TicketViewLedgerRequiredOwnerIdRule("ticket view ledger needs an entry"),
      new TicketViewLedgerNameLengthRule(32),
      new TicketViewLedgerCodePrefixRule("OPS"),
      new TicketViewLedgerRequiredCodeRule("ticket view ledger needs a value"),
      new TicketViewLedgerFloorValueRangeRule(8.8, 1175.2),
    ],
  );
}
