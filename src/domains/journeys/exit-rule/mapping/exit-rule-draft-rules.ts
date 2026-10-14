import * as text from "../../../../kit/text.js";
import { ExitRuleDraft } from "./exit-rule-draft.js";

/** A rule a exit rule draft must pass. Check returns its problems, or none. */
export interface ExitRuleDraftRule {
  check(item: ExitRuleDraft): string[];
}

export class ExitRuleDraftRequiredCodeRule implements ExitRuleDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleDraftRequiredLocaleRule implements ExitRuleDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleDraft): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleDraftCountryLengthRule implements ExitRuleDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleDraft): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleDraftCodePrefixRule implements ExitRuleDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ExitRuleDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ExitRuleDraftAllowedCountryRule implements ExitRuleDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ExitRuleDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is stale`];
    return [];
  }
}

export class ExitRuleDraftRequiredCountryRule implements ExitRuleDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleDraft): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a exit rule draft. */
export class ExitRuleDraftValidator {
  rules: ExitRuleDraftRule[];

  constructor(rules: ExitRuleDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleDraft): string[] {
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

  requireValid(item: ExitRuleDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleDraft[]): Map<string, string[]> {
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

export function defaultExitRuleDraftValidator(): ExitRuleDraftValidator {
  return new ExitRuleDraftValidator(
    [
      new ExitRuleDraftRequiredCodeRule("exit rule draft needs an entry"),
      new ExitRuleDraftRequiredLocaleRule("exit rule draft needs an entry"),
      new ExitRuleDraftCountryLengthRule(86400),
      new ExitRuleDraftCodePrefixRule("X"),
      new ExitRuleDraftAllowedCountryRule([]),
      new ExitRuleDraftRequiredCountryRule("exit rule draft needs a value"),
    ],
  );
}
