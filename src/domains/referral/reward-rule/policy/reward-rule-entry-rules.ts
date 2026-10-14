import * as text from "../../../../kit/text.js";
import { RewardRuleEntry } from "./reward-rule-entry.js";

/** A rule a reward rule entry must pass. Check returns its problems, or none. */
export interface RewardRuleEntryRule {
  check(item: RewardRuleEntry): string[];
}

export class RewardRuleEntryPriorityRangeRule implements RewardRuleEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleEntry): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRuleEntryAllowedCodeRule implements RewardRuleEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardRuleEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class RewardRuleEntryRequiredNameRule implements RewardRuleEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleEntry): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward rule entry. */
export class RewardRuleEntryValidator {
  rules: RewardRuleEntryRule[];

  constructor(rules: RewardRuleEntryRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleEntry): string[] {
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

  requireValid(item: RewardRuleEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleEntry[]): Map<string, string[]> {
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

export function defaultRewardRuleEntryValidator(): RewardRuleEntryValidator {
  return new RewardRuleEntryValidator(
    [
      new RewardRuleEntryPriorityRangeRule(255, 86400),
      new RewardRuleEntryAllowedCodeRule([]),
      new RewardRuleEntryRequiredNameRule("reward rule entry needs an entry"),
    ],
  );
}
