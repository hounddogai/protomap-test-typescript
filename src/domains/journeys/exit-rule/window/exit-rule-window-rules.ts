import * as text from "../../../../kit/text.js";
import { ExitRuleWindow } from "./exit-rule-window.js";

/** A rule a exit rule window must pass. Check returns its problems, or none. */
export interface ExitRuleWindowRule {
  check(item: ExitRuleWindow): string[];
}

export class ExitRuleWindowRequiredCodeRule implements ExitRuleWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleWindowAmountRangeRule implements ExitRuleWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleWindow): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ExitRuleWindowPriorityRangeRule implements ExitRuleWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleWindow): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleWindowRequiredCampaignRefRule implements ExitRuleWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleWindow): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleWindowAllowedCampaignRefRule implements ExitRuleWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ExitRuleWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is duplicated`];
    return [];
  }
}

/** Runs every rule of a exit rule window. */
export class ExitRuleWindowValidator {
  rules: ExitRuleWindowRule[];

  constructor(rules: ExitRuleWindowRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleWindow[]): Map<string, string[]> {
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

export function defaultExitRuleWindowValidator(): ExitRuleWindowValidator {
  return new ExitRuleWindowValidator(
    [
      new ExitRuleWindowRequiredCodeRule("exit rule window needs a value"),
      new ExitRuleWindowAmountRangeRule(7.2, 2698.4),
      new ExitRuleWindowPriorityRangeRule(32, 1000),
      new ExitRuleWindowRequiredCampaignRefRule("exit rule window needs a value"),
      new ExitRuleWindowAllowedCampaignRefRule(["default", "strict", "adaptive"]),
    ],
  );
}
