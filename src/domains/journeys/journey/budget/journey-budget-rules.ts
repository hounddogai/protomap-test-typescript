import * as text from "../../../../kit/text.js";
import { JourneyBudget } from "./journey-budget.js";

/** A rule a journey budget must pass. Check returns its problems, or none. */
export interface JourneyBudgetRule {
  check(item: JourneyBudget): string[];
}

export class JourneyBudgetRequiredLabelRule implements JourneyBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyBudgetAllowedOwnerIdRule implements JourneyBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: JourneyBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is not allowed`];
    return [];
  }
}

export class JourneyBudgetRetriesRangeRule implements JourneyBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyBudget): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class JourneyBudgetTagsLimitRule implements JourneyBudgetRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: JourneyBudget): string[] {
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

export class JourneyBudgetRequiredChannelRule implements JourneyBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyBudget): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyBudgetChannelLengthRule implements JourneyBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyBudget): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a journey budget. */
export class JourneyBudgetValidator {
  rules: JourneyBudgetRule[];

  constructor(rules: JourneyBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyBudget): string[] {
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

  requireValid(item: JourneyBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyBudget[]): Map<string, string[]> {
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

export function defaultJourneyBudgetValidator(): JourneyBudgetValidator {
  return new JourneyBudgetValidator(
    [
      new JourneyBudgetRequiredLabelRule("journey budget needs this field"),
      new JourneyBudgetAllowedOwnerIdRule(["tiered", "fallback", "lenient"]),
      new JourneyBudgetRetriesRangeRule(64, 64),
      new JourneyBudgetTagsLimitRule(120, []),
      new JourneyBudgetRequiredChannelRule("journey budget needs a value"),
      new JourneyBudgetChannelLengthRule(255),
    ],
  );
}
