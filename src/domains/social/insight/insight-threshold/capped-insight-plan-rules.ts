import * as text from "../../../../kit/text.js";
import { CappedInsightPlan } from "./capped-insight-plan.js";

/** A rule a capped insight plan must pass. Check returns its problems, or none. */
export interface CappedInsightPlanRule {
  check(item: CappedInsightPlan): string[];
}

export class CappedInsightPlanCodePrefixRule implements CappedInsightPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedInsightPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedInsightPlanRequiredNotesRule implements CappedInsightPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedInsightPlan): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class CappedInsightPlanCodeLengthRule implements CappedInsightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedInsightPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedInsightPlanQuantityRangeRule implements CappedInsightPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedInsightPlan): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedInsightPlanAllowedNotesRule implements CappedInsightPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedInsightPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is below minimum`];
    return [];
  }
}

export class CappedInsightPlanAttemptsRangeRule implements CappedInsightPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedInsightPlan): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a capped insight plan. */
export class CappedInsightPlanValidator {
  rules: CappedInsightPlanRule[];

  constructor(rules: CappedInsightPlanRule[]) {
    this.rules = rules;
  }

  validate(item: CappedInsightPlan): string[] {
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

  requireValid(item: CappedInsightPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedInsightPlan[]): Map<string, string[]> {
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

export function defaultCappedInsightPlanValidator(): CappedInsightPlanValidator {
  return new CappedInsightPlanValidator(
    [
      new CappedInsightPlanCodePrefixRule("Q"),
      new CappedInsightPlanRequiredNotesRule("capped insight plan needs this field"),
      new CappedInsightPlanCodeLengthRule(120),
      new CappedInsightPlanQuantityRangeRule(255, 255),
      new CappedInsightPlanAllowedNotesRule(["strict", "global"]),
      new CappedInsightPlanAttemptsRangeRule(3600, 86400),
    ],
  );
}
