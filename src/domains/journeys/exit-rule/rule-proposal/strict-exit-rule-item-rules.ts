import * as text from "../../../../kit/text.js";
import { StrictExitRuleItem } from "./strict-exit-rule-item.js";

/** A rule a strict exit rule item must pass. Check returns its problems, or none. */
export interface StrictExitRuleItemRule {
  check(item: StrictExitRuleItem): string[];
}

export class StrictExitRuleItemCodeLengthRule implements StrictExitRuleItemRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictExitRuleItem): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictExitRuleItemLabelLengthRule implements StrictExitRuleItemRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictExitRuleItem): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictExitRuleItemRequiredDescriptionRule implements StrictExitRuleItemRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictExitRuleItem): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class StrictExitRuleItemBidRangeRule implements StrictExitRuleItemRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictExitRuleItem): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictExitRuleItemAllowedCodeRule implements StrictExitRuleItemRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictExitRuleItem): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class StrictExitRuleItemCostRangeRule implements StrictExitRuleItemRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictExitRuleItem): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a strict exit rule item. */
export class StrictExitRuleItemValidator {
  rules: StrictExitRuleItemRule[];

  constructor(rules: StrictExitRuleItemRule[]) {
    this.rules = rules;
  }

  validate(item: StrictExitRuleItem): string[] {
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

  requireValid(item: StrictExitRuleItem): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictExitRuleItem[]): Map<string, string[]> {
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

export function defaultStrictExitRuleItemValidator(): StrictExitRuleItemValidator {
  return new StrictExitRuleItemValidator(
    [
      new StrictExitRuleItemCodeLengthRule(255),
      new StrictExitRuleItemLabelLengthRule(32),
      new StrictExitRuleItemRequiredDescriptionRule("strict exit rule item needs an entry"),
      new StrictExitRuleItemBidRangeRule(0.2, 188.2),
      new StrictExitRuleItemAllowedCodeRule(["strict", "fallback", "capped"]),
      new StrictExitRuleItemCostRangeRule(7.9, 2042.3),
    ],
  );
}
