import * as text from "../../../../kit/text.js";
import { LenientOptOutCycle } from "./lenient-opt-out-cycle.js";

/** A rule a lenient opt out cycle must pass. Check returns its problems, or none. */
export interface LenientOptOutCycleRule {
  check(item: LenientOptOutCycle): string[];
}

export class LenientOptOutCycleCodePrefixRule implements LenientOptOutCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientOptOutCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientOptOutCycleAllowedCountryRule implements LenientOptOutCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientOptOutCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is not allowed`];
    return [];
  }
}

export class LenientOptOutCycleRatioRangeRule implements LenientOptOutCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientOptOutCycle): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient opt out cycle. */
export class LenientOptOutCycleValidator {
  rules: LenientOptOutCycleRule[];

  constructor(rules: LenientOptOutCycleRule[]) {
    this.rules = rules;
  }

  validate(item: LenientOptOutCycle): string[] {
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

  requireValid(item: LenientOptOutCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientOptOutCycle[]): Map<string, string[]> {
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

export function defaultLenientOptOutCycleValidator(): LenientOptOutCycleValidator {
  return new LenientOptOutCycleValidator(
    [
      new LenientOptOutCycleCodePrefixRule("REF"),
      new LenientOptOutCycleAllowedCountryRule(["adaptive", "adaptive", "capped"]),
      new LenientOptOutCycleRatioRangeRule(5.9, 1626.9),
    ],
  );
}
