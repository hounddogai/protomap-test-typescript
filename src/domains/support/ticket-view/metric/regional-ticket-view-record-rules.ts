import { RegionalTicketViewRecord } from "./regional-ticket-view-record.js";

/** A rule a regional ticket view record must pass. Check returns its problems, or none. */
export interface RegionalTicketViewRecordRule {
  check(item: RegionalTicketViewRecord): string[];
}

export class RegionalTicketViewRecordCodePrefixRule implements RegionalTicketViewRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalTicketViewRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalTicketViewRecordRequiredNameRule implements RegionalTicketViewRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalTicketViewRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalTicketViewRecordArchivedGuardRule implements RegionalTicketViewRecordRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RegionalTicketViewRecord): string[] {
    if (item.archived && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class RegionalTicketViewRecordImpressionsRangeRule implements RegionalTicketViewRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalTicketViewRecord): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a regional ticket view record. */
export class RegionalTicketViewRecordValidator {
  rules: RegionalTicketViewRecordRule[];

  constructor(rules: RegionalTicketViewRecordRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalTicketViewRecord): string[] {
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

  requireValid(item: RegionalTicketViewRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalTicketViewRecord[]): Map<string, string[]> {
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

export function defaultRegionalTicketViewRecordValidator(): RegionalTicketViewRecordValidator {
  return new RegionalTicketViewRecordValidator(
    [
      new RegionalTicketViewRecordCodePrefixRule("X"),
      new RegionalTicketViewRecordRequiredNameRule("regional ticket view record needs this field"),
      new RegionalTicketViewRecordArchivedGuardRule(80),
      new RegionalTicketViewRecordImpressionsRangeRule(64, 80),
    ],
  );
}
