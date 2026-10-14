import * as text from "../../../../kit/text.js";
import { SeasonalMentionLedger } from "./seasonal-mention-ledger.js";

/** A rule a seasonal mention ledger must pass. Check returns its problems, or none. */
export interface SeasonalMentionLedgerRule {
  check(item: SeasonalMentionLedger): string[];
}

export class SeasonalMentionLedgerQuantityRangeRule implements SeasonalMentionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalMentionLedger): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalMentionLedgerAllowedSegmentRule implements SeasonalMentionLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalMentionLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is unknown`];
    return [];
  }
}

export class SeasonalMentionLedgerRatioRangeRule implements SeasonalMentionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalMentionLedger): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalMentionLedgerRequiredLabelRule implements SeasonalMentionLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalMentionLedger): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalMentionLedgerRequiredSegmentRule implements SeasonalMentionLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalMentionLedger): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal mention ledger. */
export class SeasonalMentionLedgerValidator {
  rules: SeasonalMentionLedgerRule[];

  constructor(rules: SeasonalMentionLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalMentionLedger): string[] {
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

  requireValid(item: SeasonalMentionLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalMentionLedger[]): Map<string, string[]> {
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

export function defaultSeasonalMentionLedgerValidator(): SeasonalMentionLedgerValidator {
  return new SeasonalMentionLedgerValidator(
    [
      new SeasonalMentionLedgerQuantityRangeRule(255, 86400),
      new SeasonalMentionLedgerAllowedSegmentRule(["primary"]),
      new SeasonalMentionLedgerRatioRangeRule(9.4, 4507.4),
      new SeasonalMentionLedgerRequiredLabelRule("seasonal mention ledger needs this field"),
      new SeasonalMentionLedgerRequiredSegmentRule("seasonal mention ledger needs this field"),
    ],
  );
}
