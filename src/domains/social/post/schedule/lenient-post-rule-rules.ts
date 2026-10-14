import * as text from "../../../../kit/text.js";
import { LenientPostRule } from "./lenient-post-rule.js";

/** A rule a lenient post rule must pass. Check returns its problems, or none. */
export interface LenientPostRuleRule {
  check(item: LenientPostRule): string[];
}

export class LenientPostRuleVisibleGuardRule implements LenientPostRuleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientPostRule): string[] {
    if (item.visible && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class LenientPostRuleScoreRangeRule implements LenientPostRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPostRule): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientPostRuleAllowedDescriptionRule implements LenientPostRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientPostRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is duplicated`];
    return [];
  }
}

export class LenientPostRuleCodeLengthRule implements LenientPostRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPostRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPostRuleTitleLengthRule implements LenientPostRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPostRule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPostRuleDescriptionLengthRule implements LenientPostRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPostRule): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient post rule. */
export class LenientPostRuleValidator {
  rules: LenientPostRuleRule[];

  constructor(rules: LenientPostRuleRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPostRule): string[] {
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

  requireValid(item: LenientPostRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPostRule[]): Map<string, string[]> {
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

export function defaultLenientPostRuleValidator(): LenientPostRuleValidator {
  return new LenientPostRuleValidator(
    [
      new LenientPostRuleVisibleGuardRule(5.3),
      new LenientPostRuleScoreRangeRule(1.7, 2064.5),
      new LenientPostRuleAllowedDescriptionRule(["rolling"]),
      new LenientPostRuleCodeLengthRule(64),
      new LenientPostRuleTitleLengthRule(64),
      new LenientPostRuleDescriptionLengthRule(3600),
    ],
  );
}
