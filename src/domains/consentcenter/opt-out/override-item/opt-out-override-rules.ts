import * as text from "../../../../kit/text.js";
import { OptOutOverride } from "./opt-out-override.js";

/** A rule a opt out override must pass. Check returns its problems, or none. */
export interface OptOutOverrideRule {
  check(item: OptOutOverride): string[];
}

export class OptOutOverrideAllowedCodeRule implements OptOutOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: OptOutOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class OptOutOverrideRequiredSummaryRule implements OptOutOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutOverride): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutOverrideCodePrefixRule implements OptOutOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: OptOutOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class OptOutOverrideAmountRangeRule implements OptOutOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutOverride): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class OptOutOverrideRequiredTitleRule implements OptOutOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutOverride): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutOverrideRequiredVariantRule implements OptOutOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutOverride): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a opt out override. */
export class OptOutOverrideValidator {
  rules: OptOutOverrideRule[];

  constructor(rules: OptOutOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutOverride): string[] {
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

  requireValid(item: OptOutOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutOverride[]): Map<string, string[]> {
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

export function defaultOptOutOverrideValidator(): OptOutOverrideValidator {
  return new OptOutOverrideValidator(
    [
      new OptOutOverrideAllowedCodeRule(["regional"]),
      new OptOutOverrideRequiredSummaryRule("opt out override needs this field"),
      new OptOutOverrideCodePrefixRule("ACM"),
      new OptOutOverrideAmountRangeRule(7.9, 2318.1),
      new OptOutOverrideRequiredTitleRule("opt out override needs an entry"),
      new OptOutOverrideRequiredVariantRule("opt out override needs an entry"),
    ],
  );
}
