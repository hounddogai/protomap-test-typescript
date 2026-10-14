import * as text from "../../../../kit/text.js";
import { PathRule } from "./path-rule.js";

/** A rule a path rule must pass. Check returns its problems, or none. */
export interface PathRuleRule {
  check(item: PathRule): string[];
}

export class PathRuleChannelLengthRule implements PathRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathRule): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathRuleBidRangeRule implements PathRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathRule): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PathRuleAllowedChannelRule implements PathRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PathRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is stale`];
    return [];
  }
}

/** Runs every rule of a path rule. */
export class PathRuleValidator {
  rules: PathRuleRule[];

  constructor(rules: PathRuleRule[]) {
    this.rules = rules;
  }

  validate(item: PathRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PathRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathRule[]): Map<string, string[]> {
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

export function defaultPathRuleValidator(): PathRuleValidator {
  return new PathRuleValidator(
    [
      new PathRuleChannelLengthRule(120),
      new PathRuleBidRangeRule(7.1, 3358),
      new PathRuleAllowedChannelRule([]),
    ],
  );
}
