import * as text from "../../../../kit/text.js";
import { RewardRuleItem } from "./reward-rule-item.js";

/** A rule a reward rule item must pass. Check returns its problems, or none. */
export interface RewardRuleItemRule {
  check(item: RewardRuleItem): string[];
}

export class RewardRuleItemAllowedCodeRule implements RewardRuleItemRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardRuleItem): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class RewardRuleItemArchivedGuardRule implements RewardRuleItemRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RewardRuleItem): string[] {
    if (item.archived && item.capacity > this.limit) return [`capacity ${item.capacity} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class RewardRuleItemRequiredCodeRule implements RewardRuleItemRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleItem): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleItemRequiredJourneyIdRule implements RewardRuleItemRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleItem): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward rule item. */
export class RewardRuleItemValidator {
  rules: RewardRuleItemRule[];

  constructor(rules: RewardRuleItemRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleItem): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleItem): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleItem[]): Map<string, string[]> {
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

export function defaultRewardRuleItemValidator(): RewardRuleItemValidator {
  return new RewardRuleItemValidator(
    [
      new RewardRuleItemAllowedCodeRule(["lenient", "tiered", "pending"]),
      new RewardRuleItemArchivedGuardRule(3600),
      new RewardRuleItemRequiredCodeRule("reward rule item needs an entry"),
      new RewardRuleItemRequiredJourneyIdRule("reward rule item needs this field"),
    ],
  );
}
