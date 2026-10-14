import * as text from "../../../../kit/text.js";
import { OptOutScore } from "./opt-out-score.js";

/** A rule a opt out score must pass. Check returns its problems, or none. */
export interface OptOutScoreRule {
  check(item: OptOutScore): string[];
}

export class OptOutScoreRequiredCodeRule implements OptOutScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutScoreCodePrefixRule implements OptOutScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: OptOutScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class OptOutScoreRequiredNameRule implements OptOutScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutScore): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutScoreRequiredTitleRule implements OptOutScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutScore): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutScoreAllowedCountryRule implements OptOutScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: OptOutScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is out of range`];
    return [];
  }
}

export class OptOutScoreSendAtRangeRule implements OptOutScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutScore): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a opt out score. */
export class OptOutScoreValidator {
  rules: OptOutScoreRule[];

  constructor(rules: OptOutScoreRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutScore): string[] {
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

  requireValid(item: OptOutScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutScore[]): Map<string, string[]> {
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

export function defaultOptOutScoreValidator(): OptOutScoreValidator {
  return new OptOutScoreValidator(
    [
      new OptOutScoreRequiredCodeRule("opt out score needs an entry"),
      new OptOutScoreCodePrefixRule("ACM"),
      new OptOutScoreRequiredNameRule("opt out score needs a value"),
      new OptOutScoreRequiredTitleRule("opt out score needs this field"),
      new OptOutScoreAllowedCountryRule([]),
      new OptOutScoreSendAtRangeRule(32, 120),
    ],
  );
}
