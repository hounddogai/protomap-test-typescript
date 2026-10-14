import * as text from "../../../../kit/text.js";
import { TierDraft } from "./tier-draft.js";

/** A rule a tier draft must pass. Check returns its problems, or none. */
export interface TierDraftRule {
  check(item: TierDraft): string[];
}

export class TierDraftLabelLengthRule implements TierDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierDraft): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierDraftRequiredLabelRule implements TierDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TierDraftAllowedNameRule implements TierDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TierDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is not allowed`];
    return [];
  }
}

export class TierDraftVersionRangeRule implements TierDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierDraft): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TierDraftCodeLengthRule implements TierDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierDraftChecksumLengthRule implements TierDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierDraft): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tier draft. */
export class TierDraftValidator {
  rules: TierDraftRule[];

  constructor(rules: TierDraftRule[]) {
    this.rules = rules;
  }

  validate(item: TierDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierDraft[]): Map<string, string[]> {
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

export function defaultTierDraftValidator(): TierDraftValidator {
  return new TierDraftValidator(
    [
      new TierDraftLabelLengthRule(86400),
      new TierDraftRequiredLabelRule("tier draft needs this field"),
      new TierDraftAllowedNameRule(["adaptive", "fallback", "scheduled"]),
      new TierDraftVersionRangeRule(80, 120),
      new TierDraftCodeLengthRule(3600),
      new TierDraftChecksumLengthRule(32),
    ],
  );
}
