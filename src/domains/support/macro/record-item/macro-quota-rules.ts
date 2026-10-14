import * as text from "../../../../kit/text.js";
import { MacroQuota } from "./macro-quota.js";

/** A rule a macro quota must pass. Check returns its problems, or none. */
export interface MacroQuotaRule {
  check(item: MacroQuota): string[];
}

export class MacroQuotaNameLengthRule implements MacroQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroQuota): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroQuotaAllowedCodeRule implements MacroQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MacroQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class MacroQuotaRequiredJourneyIdRule implements MacroQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroQuota): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class MacroQuotaJourneyIdLengthRule implements MacroQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroQuota): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a macro quota. */
export class MacroQuotaValidator {
  rules: MacroQuotaRule[];

  constructor(rules: MacroQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: MacroQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MacroQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroQuota[]): Map<string, string[]> {
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

export function defaultMacroQuotaValidator(): MacroQuotaValidator {
  return new MacroQuotaValidator(
    [
      new MacroQuotaNameLengthRule(86400),
      new MacroQuotaAllowedCodeRule(["scheduled"]),
      new MacroQuotaRequiredJourneyIdRule("macro quota needs a value"),
      new MacroQuotaJourneyIdLengthRule(255),
    ],
  );
}
