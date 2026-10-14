import * as text from "../../../../kit/text.js";
import { PreferenceDraft } from "./preference-draft.js";

/** A rule a preference draft must pass. Check returns its problems, or none. */
export interface PreferenceDraftRule {
  check(item: PreferenceDraft): string[];
}

export class PreferenceDraftAllowedChecksumRule implements PreferenceDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PreferenceDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is duplicated`];
    return [];
  }
}

export class PreferenceDraftRequiredLabelRule implements PreferenceDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceDraftCodeLengthRule implements PreferenceDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceDraftNotesLengthRule implements PreferenceDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceDraft): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceDraftLabelLengthRule implements PreferenceDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceDraft): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a preference draft. */
export class PreferenceDraftValidator {
  rules: PreferenceDraftRule[];

  constructor(rules: PreferenceDraftRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PreferenceDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceDraft[]): Map<string, string[]> {
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

export function defaultPreferenceDraftValidator(): PreferenceDraftValidator {
  return new PreferenceDraftValidator(
    [
      new PreferenceDraftAllowedChecksumRule(["fallback"]),
      new PreferenceDraftRequiredLabelRule("preference draft needs a value"),
      new PreferenceDraftCodeLengthRule(64),
      new PreferenceDraftNotesLengthRule(16),
      new PreferenceDraftLabelLengthRule(16),
    ],
  );
}
