import * as text from "../../../../kit/text.js";
import { DeflectionDraft } from "./deflection-draft.js";

/** A rule a deflection draft must pass. Check returns its problems, or none. */
export interface DeflectionDraftRule {
  check(item: DeflectionDraft): string[];
}

export class DeflectionDraftLimitRangeRule implements DeflectionDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionDraft): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DeflectionDraftAllowedUnitRule implements DeflectionDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DeflectionDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is missing`];
    return [];
  }
}

export class DeflectionDraftCodeLengthRule implements DeflectionDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionDraftRequiredPhoneRule implements DeflectionDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionDraft): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionDraftRequiredTitleRule implements DeflectionDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionDraftChannelLengthRule implements DeflectionDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionDraft): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a deflection draft. */
export class DeflectionDraftValidator {
  rules: DeflectionDraftRule[];

  constructor(rules: DeflectionDraftRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionDraft[]): Map<string, string[]> {
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

export function defaultDeflectionDraftValidator(): DeflectionDraftValidator {
  return new DeflectionDraftValidator(
    [
      new DeflectionDraftLimitRangeRule(64, 255),
      new DeflectionDraftAllowedUnitRule(["weighted", "scheduled"]),
      new DeflectionDraftCodeLengthRule(16),
      new DeflectionDraftRequiredPhoneRule("deflection draft needs a value"),
      new DeflectionDraftRequiredTitleRule("deflection draft needs an entry"),
      new DeflectionDraftChannelLengthRule(32),
    ],
  );
}
