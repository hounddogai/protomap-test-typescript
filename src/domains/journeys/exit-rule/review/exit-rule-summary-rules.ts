import * as text from "../../../../kit/text.js";
import { ExitRuleSummary } from "./exit-rule-summary.js";

/** A rule a exit rule summary must pass. Check returns its problems, or none. */
export interface ExitRuleSummaryRule {
  check(item: ExitRuleSummary): string[];
}

export class ExitRuleSummaryOwnerIdLengthRule implements ExitRuleSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleSummary): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleSummaryRequiredAudienceIdRule implements ExitRuleSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleSummary): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleSummaryAudienceIdLengthRule implements ExitRuleSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleSummary): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleSummaryFrequencyCapRangeRule implements ExitRuleSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleSummary): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleSummaryAllowedCodeRule implements ExitRuleSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ExitRuleSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

/** Runs every rule of a exit rule summary. */
export class ExitRuleSummaryValidator {
  rules: ExitRuleSummaryRule[];

  constructor(rules: ExitRuleSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleSummary): string[] {
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

  requireValid(item: ExitRuleSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleSummary[]): Map<string, string[]> {
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

export function defaultExitRuleSummaryValidator(): ExitRuleSummaryValidator {
  return new ExitRuleSummaryValidator(
    [
      new ExitRuleSummaryOwnerIdLengthRule(80),
      new ExitRuleSummaryRequiredAudienceIdRule("exit rule summary needs a value"),
      new ExitRuleSummaryAudienceIdLengthRule(80),
      new ExitRuleSummaryFrequencyCapRangeRule(64, 80),
      new ExitRuleSummaryAllowedCodeRule([]),
    ],
  );
}
