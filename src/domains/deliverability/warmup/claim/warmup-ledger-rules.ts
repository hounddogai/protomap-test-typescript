import * as text from "../../../../kit/text.js";
import { WarmupLedger } from "./warmup-ledger.js";

/** A rule a warmup ledger must pass. Check returns its problems, or none. */
export interface WarmupLedgerRule {
  check(item: WarmupLedger): string[];
}

export class WarmupLedgerRequiredReviewerRule implements WarmupLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupLedger): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupLedgerImpressionsRangeRule implements WarmupLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupLedger): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WarmupLedgerCodeLengthRule implements WarmupLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupLedgerAllowedNameRule implements WarmupLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WarmupLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

export class WarmupLedgerEndsAtRangeRule implements WarmupLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupLedger): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a warmup ledger. */
export class WarmupLedgerValidator {
  rules: WarmupLedgerRule[];

  constructor(rules: WarmupLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupLedger): string[] {
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

  requireValid(item: WarmupLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupLedger[]): Map<string, string[]> {
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

export function defaultWarmupLedgerValidator(): WarmupLedgerValidator {
  return new WarmupLedgerValidator(
    [
      new WarmupLedgerRequiredReviewerRule("warmup ledger needs an entry"),
      new WarmupLedgerImpressionsRangeRule(16, 120),
      new WarmupLedgerCodeLengthRule(86400),
      new WarmupLedgerAllowedNameRule(["lenient", "global", "strict"]),
      new WarmupLedgerEndsAtRangeRule(120, 86400),
    ],
  );
}
