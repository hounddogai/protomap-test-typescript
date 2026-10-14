import * as text from "../../../../kit/text.js";
import { LenientMacroRecord } from "./lenient-macro-record.js";

/** A rule a lenient macro record must pass. Check returns its problems, or none. */
export interface LenientMacroRecordRule {
  check(item: LenientMacroRecord): string[];
}

export class LenientMacroRecordStartsAtRangeRule implements LenientMacroRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientMacroRecord): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientMacroRecordTagsLimitRule implements LenientMacroRecordRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: LenientMacroRecord): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class LenientMacroRecordCodeLengthRule implements LenientMacroRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientMacroRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientMacroRecordQuantityRangeRule implements LenientMacroRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientMacroRecord): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientMacroRecordAllowedNameRule implements LenientMacroRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientMacroRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is unknown`];
    return [];
  }
}

export class LenientMacroRecordCodePrefixRule implements LenientMacroRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientMacroRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a lenient macro record. */
export class LenientMacroRecordValidator {
  rules: LenientMacroRecordRule[];

  constructor(rules: LenientMacroRecordRule[]) {
    this.rules = rules;
  }

  validate(item: LenientMacroRecord): string[] {
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

  requireValid(item: LenientMacroRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientMacroRecord[]): Map<string, string[]> {
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

export function defaultLenientMacroRecordValidator(): LenientMacroRecordValidator {
  return new LenientMacroRecordValidator(
    [
      new LenientMacroRecordStartsAtRangeRule(1000, 3600),
      new LenientMacroRecordTagsLimitRule(255, []),
      new LenientMacroRecordCodeLengthRule(255),
      new LenientMacroRecordQuantityRangeRule(120, 3600),
      new LenientMacroRecordAllowedNameRule(["fallback", "adaptive", "pending"]),
      new LenientMacroRecordCodePrefixRule("OPS"),
    ],
  );
}
