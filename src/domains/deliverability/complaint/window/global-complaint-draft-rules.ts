import * as text from "../../../../kit/text.js";
import { GlobalComplaintDraft } from "./global-complaint-draft.js";

/** A rule a global complaint draft must pass. Check returns its problems, or none. */
export interface GlobalComplaintDraftRule {
  check(item: GlobalComplaintDraft): string[];
}

export class GlobalComplaintDraftCodePrefixRule implements GlobalComplaintDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalComplaintDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalComplaintDraftAmountRangeRule implements GlobalComplaintDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalComplaintDraft): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalComplaintDraftAllowedNameRule implements GlobalComplaintDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalComplaintDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is not allowed`];
    return [];
  }
}

export class GlobalComplaintDraftRequiredCodeRule implements GlobalComplaintDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalComplaintDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalComplaintDraftExternalRefLengthRule implements GlobalComplaintDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalComplaintDraft): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalComplaintDraftExpiresAtRangeRule implements GlobalComplaintDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalComplaintDraft): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a global complaint draft. */
export class GlobalComplaintDraftValidator {
  rules: GlobalComplaintDraftRule[];

  constructor(rules: GlobalComplaintDraftRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalComplaintDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalComplaintDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalComplaintDraft[]): Map<string, string[]> {
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

export function defaultGlobalComplaintDraftValidator(): GlobalComplaintDraftValidator {
  return new GlobalComplaintDraftValidator(
    [
      new GlobalComplaintDraftCodePrefixRule("REF"),
      new GlobalComplaintDraftAmountRangeRule(1.4, 2962.4),
      new GlobalComplaintDraftAllowedNameRule(["seasonal"]),
      new GlobalComplaintDraftRequiredCodeRule("global complaint draft needs an entry"),
      new GlobalComplaintDraftExternalRefLengthRule(86400),
      new GlobalComplaintDraftExpiresAtRangeRule(64, 255),
    ],
  );
}
