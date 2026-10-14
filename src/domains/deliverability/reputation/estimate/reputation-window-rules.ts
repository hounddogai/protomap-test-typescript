import * as text from "../../../../kit/text.js";
import { ReputationWindow } from "./reputation-window.js";

/** A rule a reputation window must pass. Check returns its problems, or none. */
export interface ReputationWindowRule {
  check(item: ReputationWindow): string[];
}

export class ReputationWindowCodeLengthRule implements ReputationWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationWindowCodePrefixRule implements ReputationWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReputationWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReputationWindowUtmSourceLengthRule implements ReputationWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationWindow): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationWindowRequiredSummaryRule implements ReputationWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationWindow): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationWindowAllowedUtmSourceRule implements ReputationWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReputationWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is above maximum`];
    return [];
  }
}

export class ReputationWindowRequiredCodeRule implements ReputationWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reputation window. */
export class ReputationWindowValidator {
  rules: ReputationWindowRule[];

  constructor(rules: ReputationWindowRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationWindow): string[] {
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

  requireValid(item: ReputationWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationWindow[]): Map<string, string[]> {
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

export function defaultReputationWindowValidator(): ReputationWindowValidator {
  return new ReputationWindowValidator(
    [
      new ReputationWindowCodeLengthRule(32),
      new ReputationWindowCodePrefixRule("REF"),
      new ReputationWindowUtmSourceLengthRule(1000),
      new ReputationWindowRequiredSummaryRule("reputation window needs this field"),
      new ReputationWindowAllowedUtmSourceRule([]),
      new ReputationWindowRequiredCodeRule("reputation window needs this field"),
    ],
  );
}
