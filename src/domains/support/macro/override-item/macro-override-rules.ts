import * as text from "../../../../kit/text.js";
import { MacroOverride } from "./macro-override.js";

/** A rule a macro override must pass. Check returns its problems, or none. */
export interface MacroOverrideRule {
  check(item: MacroOverride): string[];
}

export class MacroOverrideRequiredReviewerRule implements MacroOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroOverride): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class MacroOverrideRequiredContactEmailRule implements MacroOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroOverride): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class MacroOverrideLabelLengthRule implements MacroOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroOverride): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroOverrideAllowedContactEmailRule implements MacroOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MacroOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is blocked`];
    return [];
  }
}

export class MacroOverrideClicksRangeRule implements MacroOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroOverride): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MacroOverrideReviewerLengthRule implements MacroOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroOverride): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a macro override. */
export class MacroOverrideValidator {
  rules: MacroOverrideRule[];

  constructor(rules: MacroOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: MacroOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MacroOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroOverride[]): Map<string, string[]> {
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

export function defaultMacroOverrideValidator(): MacroOverrideValidator {
  return new MacroOverrideValidator(
    [
      new MacroOverrideRequiredReviewerRule("macro override needs a value"),
      new MacroOverrideRequiredContactEmailRule("macro override needs a value"),
      new MacroOverrideLabelLengthRule(64),
      new MacroOverrideAllowedContactEmailRule(["strict"]),
      new MacroOverrideClicksRangeRule(16, 32),
      new MacroOverrideReviewerLengthRule(80),
    ],
  );
}
