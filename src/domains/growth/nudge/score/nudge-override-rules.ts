import * as text from "../../../../kit/text.js";
import { NudgeOverride } from "./nudge-override.js";

/** A rule a nudge override must pass. Check returns its problems, or none. */
export interface NudgeOverrideRule {
  check(item: NudgeOverride): string[];
}

export class NudgeOverrideSendAtRangeRule implements NudgeOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeOverride): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class NudgeOverrideTitleLengthRule implements NudgeOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeOverride): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeOverrideGraceDaysRangeRule implements NudgeOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeOverride): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class NudgeOverrideRequiredCodeRule implements NudgeOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeOverrideAllowedCodeRule implements NudgeOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: NudgeOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class NudgeOverrideCodePrefixRule implements NudgeOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: NudgeOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a nudge override. */
export class NudgeOverrideValidator {
  rules: NudgeOverrideRule[];

  constructor(rules: NudgeOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeOverride): string[] {
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

  requireValid(item: NudgeOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeOverride[]): Map<string, string[]> {
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

export function defaultNudgeOverrideValidator(): NudgeOverrideValidator {
  return new NudgeOverrideValidator(
    [
      new NudgeOverrideSendAtRangeRule(80, 255),
      new NudgeOverrideTitleLengthRule(3600),
      new NudgeOverrideGraceDaysRangeRule(16, 32),
      new NudgeOverrideRequiredCodeRule("nudge override needs a value"),
      new NudgeOverrideAllowedCodeRule(["capped"]),
      new NudgeOverrideCodePrefixRule("REF"),
    ],
  );
}
