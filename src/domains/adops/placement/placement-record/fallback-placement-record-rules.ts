import * as text from "../../../../kit/text.js";
import { FallbackPlacementRecord } from "./fallback-placement-record.js";

/** A rule a fallback placement record must pass. Check returns its problems, or none. */
export interface FallbackPlacementRecordRule {
  check(item: FallbackPlacementRecord): string[];
}

export class FallbackPlacementRecordAllowedNotesRule implements FallbackPlacementRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackPlacementRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is duplicated`];
    return [];
  }
}

export class FallbackPlacementRecordImpressionsRangeRule implements FallbackPlacementRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPlacementRecord): string[] {
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

export class FallbackPlacementRecordRequiredTitleRule implements FallbackPlacementRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPlacementRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPlacementRecordRequiredContactEmailRule implements FallbackPlacementRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPlacementRecord): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPlacementRecordMinimumRangeRule implements FallbackPlacementRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPlacementRecord): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback placement record. */
export class FallbackPlacementRecordValidator {
  rules: FallbackPlacementRecordRule[];

  constructor(rules: FallbackPlacementRecordRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPlacementRecord): string[] {
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

  requireValid(item: FallbackPlacementRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPlacementRecord[]): Map<string, string[]> {
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

export function defaultFallbackPlacementRecordValidator(): FallbackPlacementRecordValidator {
  return new FallbackPlacementRecordValidator(
    [
      new FallbackPlacementRecordAllowedNotesRule(["primary", "weighted"]),
      new FallbackPlacementRecordImpressionsRangeRule(120, 86400),
      new FallbackPlacementRecordRequiredTitleRule("fallback placement record needs an entry"),
      new FallbackPlacementRecordRequiredContactEmailRule("fallback placement record needs an entry"),
      new FallbackPlacementRecordMinimumRangeRule(7.6, 302.3),
    ],
  );
}
