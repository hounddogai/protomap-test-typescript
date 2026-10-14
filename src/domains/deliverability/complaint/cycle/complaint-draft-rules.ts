import * as text from "../../../../kit/text.js";
import { ComplaintDraft } from "./complaint-draft.js";

/** A rule a complaint draft must pass. Check returns its problems, or none. */
export interface ComplaintDraftRule {
  check(item: ComplaintDraft): string[];
}

export class ComplaintDraftSequenceRangeRule implements ComplaintDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintDraft): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ComplaintDraftNotesLengthRule implements ComplaintDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintDraft): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintDraftAllowedNotesRule implements ComplaintDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ComplaintDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is inconsistent`];
    return [];
  }
}

export class ComplaintDraftCodeLengthRule implements ComplaintDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintDraftRequiredNameRule implements ComplaintDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintDraft): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintDraftCodePrefixRule implements ComplaintDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ComplaintDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a complaint draft. */
export class ComplaintDraftValidator {
  rules: ComplaintDraftRule[];

  constructor(rules: ComplaintDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ComplaintDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintDraft[]): Map<string, string[]> {
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

export function defaultComplaintDraftValidator(): ComplaintDraftValidator {
  return new ComplaintDraftValidator(
    [
      new ComplaintDraftSequenceRangeRule(64, 86400),
      new ComplaintDraftNotesLengthRule(80),
      new ComplaintDraftAllowedNotesRule(["lenient", "capped", "seasonal"]),
      new ComplaintDraftCodeLengthRule(3600),
      new ComplaintDraftRequiredNameRule("complaint draft needs an entry"),
      new ComplaintDraftCodePrefixRule("Q"),
    ],
  );
}
