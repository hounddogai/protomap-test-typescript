import * as text from "../../../../kit/text.js";
import { LenientLevelDraft } from "./lenient-level-draft.js";

/** A rule a lenient level draft must pass. Check returns its problems, or none. */
export interface LenientLevelDraftRule {
  check(item: LenientLevelDraft): string[];
}

export class LenientLevelDraftAllowedCodeRule implements LenientLevelDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientLevelDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class LenientLevelDraftTitleLengthRule implements LenientLevelDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientLevelDraft): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientLevelDraftWeightRangeRule implements LenientLevelDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientLevelDraft): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a lenient level draft. */
export class LenientLevelDraftValidator {
  rules: LenientLevelDraftRule[];

  constructor(rules: LenientLevelDraftRule[]) {
    this.rules = rules;
  }

  validate(item: LenientLevelDraft): string[] {
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

  requireValid(item: LenientLevelDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientLevelDraft[]): Map<string, string[]> {
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

export function defaultLenientLevelDraftValidator(): LenientLevelDraftValidator {
  return new LenientLevelDraftValidator(
    [
      new LenientLevelDraftAllowedCodeRule([]),
      new LenientLevelDraftTitleLengthRule(1000),
      new LenientLevelDraftWeightRangeRule(7.9, 3689.1),
    ],
  );
}
