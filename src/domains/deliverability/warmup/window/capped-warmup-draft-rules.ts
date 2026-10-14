import * as text from "../../../../kit/text.js";
import { CappedWarmupDraft } from "./capped-warmup-draft.js";

/** A rule a capped warmup draft must pass. Check returns its problems, or none. */
export interface CappedWarmupDraftRule {
  check(item: CappedWarmupDraft): string[];
}

export class CappedWarmupDraftAmountRangeRule implements CappedWarmupDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedWarmupDraft): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedWarmupDraftCodePrefixRule implements CappedWarmupDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedWarmupDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedWarmupDraftAllowedCodeRule implements CappedWarmupDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedWarmupDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

/** Runs every rule of a capped warmup draft. */
export class CappedWarmupDraftValidator {
  rules: CappedWarmupDraftRule[];

  constructor(rules: CappedWarmupDraftRule[]) {
    this.rules = rules;
  }

  validate(item: CappedWarmupDraft): string[] {
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

  requireValid(item: CappedWarmupDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedWarmupDraft[]): Map<string, string[]> {
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

export function defaultCappedWarmupDraftValidator(): CappedWarmupDraftValidator {
  return new CappedWarmupDraftValidator(
    [
      new CappedWarmupDraftAmountRangeRule(1.7, 2525.2),
      new CappedWarmupDraftCodePrefixRule("X"),
      new CappedWarmupDraftAllowedCodeRule(["regional", "scheduled", "tiered"]),
    ],
  );
}
