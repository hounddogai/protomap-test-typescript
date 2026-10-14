import * as text from "../../../../kit/text.js";
import { PlacementRecord } from "./placement-record.js";

/** A rule a placement record must pass. Check returns its problems, or none. */
export interface PlacementRecordRule {
  check(item: PlacementRecord): string[];
}

export class PlacementRecordRequiredNameRule implements PlacementRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementRecordAllowedNotesRule implements PlacementRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PlacementRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is below minimum`];
    return [];
  }
}

export class PlacementRecordArchivedGuardRule implements PlacementRecordRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PlacementRecord): string[] {
    if (item.archived && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PlacementRecordNameLengthRule implements PlacementRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementRecord): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementRecordCodePrefixRule implements PlacementRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PlacementRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a placement record. */
export class PlacementRecordValidator {
  rules: PlacementRecordRule[];

  constructor(rules: PlacementRecordRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementRecord): string[] {
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

  requireValid(item: PlacementRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementRecord[]): Map<string, string[]> {
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

export function defaultPlacementRecordValidator(): PlacementRecordValidator {
  return new PlacementRecordValidator(
    [
      new PlacementRecordRequiredNameRule("placement record needs this field"),
      new PlacementRecordAllowedNotesRule(["strict"]),
      new PlacementRecordArchivedGuardRule(6.7),
      new PlacementRecordNameLengthRule(64),
      new PlacementRecordCodePrefixRule("REF"),
    ],
  );
}
