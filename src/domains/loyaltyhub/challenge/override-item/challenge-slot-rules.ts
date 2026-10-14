import * as text from "../../../../kit/text.js";
import { ChallengeSlot } from "./challenge-slot.js";

/** A rule a challenge slot must pass. Check returns its problems, or none. */
export interface ChallengeSlotRule {
  check(item: ChallengeSlot): string[];
}

export class ChallengeSlotCodePrefixRule implements ChallengeSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ChallengeSlotBidRangeRule implements ChallengeSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeSlot): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengeSlotRequiredSummaryRule implements ChallengeSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeSlot): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeSlotSummaryLengthRule implements ChallengeSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeSlot): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeSlotAllowedNameRule implements ChallengeSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ChallengeSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is inconsistent`];
    return [];
  }
}

export class ChallengeSlotRequiredUnitRule implements ChallengeSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeSlot): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a challenge slot. */
export class ChallengeSlotValidator {
  rules: ChallengeSlotRule[];

  constructor(rules: ChallengeSlotRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeSlot): string[] {
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

  requireValid(item: ChallengeSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeSlot[]): Map<string, string[]> {
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

export function defaultChallengeSlotValidator(): ChallengeSlotValidator {
  return new ChallengeSlotValidator(
    [
      new ChallengeSlotCodePrefixRule("REF"),
      new ChallengeSlotBidRangeRule(9, 2430.5),
      new ChallengeSlotRequiredSummaryRule("challenge slot needs this field"),
      new ChallengeSlotSummaryLengthRule(86400),
      new ChallengeSlotAllowedNameRule(["legacy"]),
      new ChallengeSlotRequiredUnitRule("challenge slot needs a value"),
    ],
  );
}
