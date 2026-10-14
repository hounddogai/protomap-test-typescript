import * as text from "../../../../kit/text.js";
import { DefaultJourneyScore } from "./default-journey-score.js";

/** A rule a default journey score must pass. Check returns its problems, or none. */
export interface DefaultJourneyScoreRule {
  check(item: DefaultJourneyScore): string[];
}

export class DefaultJourneyScoreCodeLengthRule implements DefaultJourneyScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultJourneyScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultJourneyScoreAllowedCodeRule implements DefaultJourneyScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultJourneyScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class DefaultJourneyScoreExternalRefLengthRule implements DefaultJourneyScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultJourneyScore): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultJourneyScoreLocaleLengthRule implements DefaultJourneyScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultJourneyScore): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultJourneyScoreRequiredLocaleRule implements DefaultJourneyScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultJourneyScore): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultJourneyScoreActiveGuardRule implements DefaultJourneyScoreRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DefaultJourneyScore): string[] {
    if (item.active && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a default journey score. */
export class DefaultJourneyScoreValidator {
  rules: DefaultJourneyScoreRule[];

  constructor(rules: DefaultJourneyScoreRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultJourneyScore): string[] {
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

  requireValid(item: DefaultJourneyScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultJourneyScore[]): Map<string, string[]> {
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

export function defaultDefaultJourneyScoreValidator(): DefaultJourneyScoreValidator {
  return new DefaultJourneyScoreValidator(
    [
      new DefaultJourneyScoreCodeLengthRule(32),
      new DefaultJourneyScoreAllowedCodeRule(["fallback"]),
      new DefaultJourneyScoreExternalRefLengthRule(16),
      new DefaultJourneyScoreLocaleLengthRule(86400),
      new DefaultJourneyScoreRequiredLocaleRule("default journey score needs this field"),
      new DefaultJourneyScoreActiveGuardRule(80),
    ],
  );
}
