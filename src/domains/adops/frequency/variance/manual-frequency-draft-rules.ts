import * as text from "../../../../kit/text.js";
import { ManualFrequencyDraft } from "./manual-frequency-draft.js";

/** A rule a manual frequency draft must pass. Check returns its problems, or none. */
export interface ManualFrequencyDraftRule {
  check(item: ManualFrequencyDraft): string[];
}

export class ManualFrequencyDraftBidRangeRule implements ManualFrequencyDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualFrequencyDraft): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualFrequencyDraftRequiredChecksumRule implements ManualFrequencyDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFrequencyDraft): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class ManualFrequencyDraftChecksumLengthRule implements ManualFrequencyDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualFrequencyDraft): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualFrequencyDraftNameLengthRule implements ManualFrequencyDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualFrequencyDraft): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualFrequencyDraftAllowedTitleRule implements ManualFrequencyDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualFrequencyDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

export class ManualFrequencyDraftBudgetRangeRule implements ManualFrequencyDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualFrequencyDraft): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual frequency draft. */
export class ManualFrequencyDraftValidator {
  rules: ManualFrequencyDraftRule[];

  constructor(rules: ManualFrequencyDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ManualFrequencyDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualFrequencyDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualFrequencyDraft[]): Map<string, string[]> {
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

export function defaultManualFrequencyDraftValidator(): ManualFrequencyDraftValidator {
  return new ManualFrequencyDraftValidator(
    [
      new ManualFrequencyDraftBidRangeRule(2.8, 3612.7),
      new ManualFrequencyDraftRequiredChecksumRule("manual frequency draft needs an entry"),
      new ManualFrequencyDraftChecksumLengthRule(255),
      new ManualFrequencyDraftNameLengthRule(86400),
      new ManualFrequencyDraftAllowedTitleRule(["legacy", "regional"]),
      new ManualFrequencyDraftBudgetRangeRule(4.8, 1742.8),
    ],
  );
}
