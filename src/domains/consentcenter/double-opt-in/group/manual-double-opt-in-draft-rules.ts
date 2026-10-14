import * as text from "../../../../kit/text.js";
import { ManualDoubleOptInDraft } from "./manual-double-opt-in-draft.js";

/** A rule a manual double opt in draft must pass. Check returns its problems, or none. */
export interface ManualDoubleOptInDraftRule {
  check(item: ManualDoubleOptInDraft): string[];
}

export class ManualDoubleOptInDraftCodeLengthRule implements ManualDoubleOptInDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualDoubleOptInDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualDoubleOptInDraftUpdatedAtRangeRule implements ManualDoubleOptInDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualDoubleOptInDraft): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualDoubleOptInDraftRequiredCodeRule implements ManualDoubleOptInDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualDoubleOptInDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualDoubleOptInDraftRequiredDescriptionRule implements ManualDoubleOptInDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualDoubleOptInDraft): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class ManualDoubleOptInDraftCodePrefixRule implements ManualDoubleOptInDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualDoubleOptInDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualDoubleOptInDraftAllowedCurrencyRule implements ManualDoubleOptInDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualDoubleOptInDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is stale`];
    return [];
  }
}

/** Runs every rule of a manual double opt in draft. */
export class ManualDoubleOptInDraftValidator {
  rules: ManualDoubleOptInDraftRule[];

  constructor(rules: ManualDoubleOptInDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ManualDoubleOptInDraft): string[] {
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

  requireValid(item: ManualDoubleOptInDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualDoubleOptInDraft[]): Map<string, string[]> {
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

export function defaultManualDoubleOptInDraftValidator(): ManualDoubleOptInDraftValidator {
  return new ManualDoubleOptInDraftValidator(
    [
      new ManualDoubleOptInDraftCodeLengthRule(32),
      new ManualDoubleOptInDraftUpdatedAtRangeRule(120, 86400),
      new ManualDoubleOptInDraftRequiredCodeRule("manual double opt in draft needs this field"),
      new ManualDoubleOptInDraftRequiredDescriptionRule("manual double opt in draft needs a value"),
      new ManualDoubleOptInDraftCodePrefixRule("OPS"),
      new ManualDoubleOptInDraftAllowedCurrencyRule([]),
    ],
  );
}
