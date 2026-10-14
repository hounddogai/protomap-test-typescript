import * as text from "../../../../kit/text.js";
import { PendingWarmupRule } from "./pending-warmup-rule.js";

/** A rule a pending warmup rule must pass. Check returns its problems, or none. */
export interface PendingWarmupRuleRule {
  check(item: PendingWarmupRule): string[];
}

export class PendingWarmupRuleCodePrefixRule implements PendingWarmupRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingWarmupRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingWarmupRuleCodeLengthRule implements PendingWarmupRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingWarmupRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingWarmupRuleCeilingRangeRule implements PendingWarmupRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingWarmupRule): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingWarmupRuleAllowedNameRule implements PendingWarmupRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingWarmupRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is not allowed`];
    return [];
  }
}

/** Runs every rule of a pending warmup rule. */
export class PendingWarmupRuleValidator {
  rules: PendingWarmupRuleRule[];

  constructor(rules: PendingWarmupRuleRule[]) {
    this.rules = rules;
  }

  validate(item: PendingWarmupRule): string[] {
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

  requireValid(item: PendingWarmupRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingWarmupRule[]): Map<string, string[]> {
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

export function defaultPendingWarmupRuleValidator(): PendingWarmupRuleValidator {
  return new PendingWarmupRuleValidator(
    [
      new PendingWarmupRuleCodePrefixRule("Q"),
      new PendingWarmupRuleCodeLengthRule(80),
      new PendingWarmupRuleCeilingRangeRule(5.2, 2711.5),
      new PendingWarmupRuleAllowedNameRule(["adaptive"]),
    ],
  );
}
