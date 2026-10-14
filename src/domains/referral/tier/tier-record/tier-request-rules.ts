import * as text from "../../../../kit/text.js";
import { TierRequest } from "./tier-request.js";

/** A rule a tier request must pass. Check returns its problems, or none. */
export interface TierRequestRule {
  check(item: TierRequest): string[];
}

export class TierRequestDurationMinutesRangeRule implements TierRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierRequest): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TierRequestRequiredCodeRule implements TierRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TierRequestAllowedCodeRule implements TierRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TierRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

/** Runs every rule of a tier request. */
export class TierRequestValidator {
  rules: TierRequestRule[];

  constructor(rules: TierRequestRule[]) {
    this.rules = rules;
  }

  validate(item: TierRequest): string[] {
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

  requireValid(item: TierRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierRequest[]): Map<string, string[]> {
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

export function defaultTierRequestValidator(): TierRequestValidator {
  return new TierRequestValidator(
    [
      new TierRequestDurationMinutesRangeRule(120, 1000),
      new TierRequestRequiredCodeRule("tier request needs an entry"),
      new TierRequestAllowedCodeRule([]),
    ],
  );
}
