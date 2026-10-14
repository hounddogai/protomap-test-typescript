import * as text from "../../../../kit/text.js";
import { RollingFlightBudget } from "./rolling-flight-budget.js";

/** A rule a rolling flight budget must pass. Check returns its problems, or none. */
export interface RollingFlightBudgetRule {
  check(item: RollingFlightBudget): string[];
}

export class RollingFlightBudgetAllowedLabelRule implements RollingFlightBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingFlightBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is stale`];
    return [];
  }
}

export class RollingFlightBudgetCodeLengthRule implements RollingFlightBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingFlightBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingFlightBudgetRequiredLabelRule implements RollingFlightBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingFlightBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RollingFlightBudgetRequiredChannelRule implements RollingFlightBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingFlightBudget): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class RollingFlightBudgetTagsLimitRule implements RollingFlightBudgetRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: RollingFlightBudget): string[] {
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

export class RollingFlightBudgetRequiredCodeRule implements RollingFlightBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingFlightBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling flight budget. */
export class RollingFlightBudgetValidator {
  rules: RollingFlightBudgetRule[];

  constructor(rules: RollingFlightBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: RollingFlightBudget): string[] {
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

  requireValid(item: RollingFlightBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingFlightBudget[]): Map<string, string[]> {
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

export function defaultRollingFlightBudgetValidator(): RollingFlightBudgetValidator {
  return new RollingFlightBudgetValidator(
    [
      new RollingFlightBudgetAllowedLabelRule(["adaptive", "capped", "capped"]),
      new RollingFlightBudgetCodeLengthRule(255),
      new RollingFlightBudgetRequiredLabelRule("rolling flight budget needs an entry"),
      new RollingFlightBudgetRequiredChannelRule("rolling flight budget needs an entry"),
      new RollingFlightBudgetTagsLimitRule(32, []),
      new RollingFlightBudgetRequiredCodeRule("rolling flight budget needs a value"),
    ],
  );
}
