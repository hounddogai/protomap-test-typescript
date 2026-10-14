import * as text from "../../../../kit/text.js";
import { LenientPayoutScore } from "./lenient-payout-score.js";

/** A rule a lenient payout score must pass. Check returns its problems, or none. */
export interface LenientPayoutScoreRule {
  check(item: LenientPayoutScore): string[];
}

export class LenientPayoutScoreExternalRefLengthRule implements LenientPayoutScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPayoutScore): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPayoutScoreLabelLengthRule implements LenientPayoutScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPayoutScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPayoutScoreRequiredCategoryRule implements LenientPayoutScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPayoutScore): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPayoutScoreAllowedExternalRefRule implements LenientPayoutScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientPayoutScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is unknown`];
    return [];
  }
}

export class LenientPayoutScoreCapacityRangeRule implements LenientPayoutScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPayoutScore): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientPayoutScoreCodeLengthRule implements LenientPayoutScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPayoutScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient payout score. */
export class LenientPayoutScoreValidator {
  rules: LenientPayoutScoreRule[];

  constructor(rules: LenientPayoutScoreRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPayoutScore): string[] {
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

  requireValid(item: LenientPayoutScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPayoutScore[]): Map<string, string[]> {
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

export function defaultLenientPayoutScoreValidator(): LenientPayoutScoreValidator {
  return new LenientPayoutScoreValidator(
    [
      new LenientPayoutScoreExternalRefLengthRule(1000),
      new LenientPayoutScoreLabelLengthRule(3600),
      new LenientPayoutScoreRequiredCategoryRule("lenient payout score needs a value"),
      new LenientPayoutScoreAllowedExternalRefRule(["rolling"]),
      new LenientPayoutScoreCapacityRangeRule(1000, 3600),
      new LenientPayoutScoreCodeLengthRule(3600),
    ],
  );
}
