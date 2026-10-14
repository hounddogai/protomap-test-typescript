import * as text from "../../../../kit/text.js";
import { MacroDraft } from "./macro-draft.js";

/** A rule a macro draft must pass. Check returns its problems, or none. */
export interface MacroDraftRule {
  check(item: MacroDraft): string[];
}

export class MacroDraftPriorityRangeRule implements MacroDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroDraft): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MacroDraftTitleLengthRule implements MacroDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroDraft): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroDraftRequiredCodeRule implements MacroDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MacroDraftCostRangeRule implements MacroDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroDraft): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MacroDraftAllowedTitleRule implements MacroDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MacroDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is missing`];
    return [];
  }
}

export class MacroDraftCodeLengthRule implements MacroDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a macro draft. */
export class MacroDraftValidator {
  rules: MacroDraftRule[];

  constructor(rules: MacroDraftRule[]) {
    this.rules = rules;
  }

  validate(item: MacroDraft): string[] {
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

  requireValid(item: MacroDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroDraft[]): Map<string, string[]> {
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

export function defaultMacroDraftValidator(): MacroDraftValidator {
  return new MacroDraftValidator(
    [
      new MacroDraftPriorityRangeRule(64, 3600),
      new MacroDraftTitleLengthRule(64),
      new MacroDraftRequiredCodeRule("macro draft needs this field"),
      new MacroDraftCostRangeRule(6.3, 2544.1),
      new MacroDraftAllowedTitleRule(["fallback", "scheduled", "seasonal"]),
      new MacroDraftCodeLengthRule(80),
    ],
  );
}
