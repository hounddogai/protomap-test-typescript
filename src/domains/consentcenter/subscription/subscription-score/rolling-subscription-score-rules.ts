import * as text from "../../../../kit/text.js";
import { RollingSubscriptionScore } from "./rolling-subscription-score.js";

/** A rule a rolling subscription score must pass. Check returns its problems, or none. */
export interface RollingSubscriptionScoreRule {
  check(item: RollingSubscriptionScore): string[];
}

export class RollingSubscriptionScoreCodePrefixRule implements RollingSubscriptionScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingSubscriptionScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingSubscriptionScoreRequiredNotesRule implements RollingSubscriptionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSubscriptionScore): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class RollingSubscriptionScoreWeightRangeRule implements RollingSubscriptionScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingSubscriptionScore): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingSubscriptionScoreCodeLengthRule implements RollingSubscriptionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingSubscriptionScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingSubscriptionScoreAllowedCodeRule implements RollingSubscriptionScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingSubscriptionScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class RollingSubscriptionScoreRequiredCodeRule implements RollingSubscriptionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSubscriptionScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling subscription score. */
export class RollingSubscriptionScoreValidator {
  rules: RollingSubscriptionScoreRule[];

  constructor(rules: RollingSubscriptionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: RollingSubscriptionScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingSubscriptionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingSubscriptionScore[]): Map<string, string[]> {
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

export function defaultRollingSubscriptionScoreValidator(): RollingSubscriptionScoreValidator {
  return new RollingSubscriptionScoreValidator(
    [
      new RollingSubscriptionScoreCodePrefixRule("ACM"),
      new RollingSubscriptionScoreRequiredNotesRule("rolling subscription score needs a value"),
      new RollingSubscriptionScoreWeightRangeRule(0.6, 4209),
      new RollingSubscriptionScoreCodeLengthRule(32),
      new RollingSubscriptionScoreAllowedCodeRule([]),
      new RollingSubscriptionScoreRequiredCodeRule("rolling subscription score needs a value"),
    ],
  );
}
