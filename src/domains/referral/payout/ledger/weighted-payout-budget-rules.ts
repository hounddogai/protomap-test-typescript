import { WeightedPayoutBudget } from "./weighted-payout-budget.js";

/** A rule a weighted payout budget must pass. Check returns its problems, or none. */
export interface WeightedPayoutBudgetRule {
  check(item: WeightedPayoutBudget): string[];
}

export class WeightedPayoutBudgetDescriptionLengthRule implements WeightedPayoutBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPayoutBudget): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPayoutBudgetRequiredOwnerIdRule implements WeightedPayoutBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPayoutBudget): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPayoutBudgetRequiredTitleRule implements WeightedPayoutBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPayoutBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPayoutBudgetTagsLimitRule implements WeightedPayoutBudgetRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: WeightedPayoutBudget): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

/** Runs every rule of a weighted payout budget. */
export class WeightedPayoutBudgetValidator {
  rules: WeightedPayoutBudgetRule[];

  constructor(rules: WeightedPayoutBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPayoutBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedPayoutBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPayoutBudget[]): Map<string, string[]> {
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

export function defaultWeightedPayoutBudgetValidator(): WeightedPayoutBudgetValidator {
  return new WeightedPayoutBudgetValidator(
    [
      new WeightedPayoutBudgetDescriptionLengthRule(86400),
      new WeightedPayoutBudgetRequiredOwnerIdRule("weighted payout budget needs this field"),
      new WeightedPayoutBudgetRequiredTitleRule("weighted payout budget needs an entry"),
      new WeightedPayoutBudgetTagsLimitRule(3600, []),
    ],
  );
}
