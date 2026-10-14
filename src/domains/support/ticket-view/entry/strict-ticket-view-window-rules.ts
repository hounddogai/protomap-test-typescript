import { StrictTicketViewWindow } from "./strict-ticket-view-window.js";

/** A rule a strict ticket view window must pass. Check returns its problems, or none. */
export interface StrictTicketViewWindowRule {
  check(item: StrictTicketViewWindow): string[];
}

export class StrictTicketViewWindowRequiredCategoryRule implements StrictTicketViewWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictTicketViewWindow): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class StrictTicketViewWindowCategoryLengthRule implements StrictTicketViewWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictTicketViewWindow): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictTicketViewWindowCodePrefixRule implements StrictTicketViewWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictTicketViewWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictTicketViewWindowGraceDaysRangeRule implements StrictTicketViewWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictTicketViewWindow): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictTicketViewWindowTagsLimitRule implements StrictTicketViewWindowRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: StrictTicketViewWindow): string[] {
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

/** Runs every rule of a strict ticket view window. */
export class StrictTicketViewWindowValidator {
  rules: StrictTicketViewWindowRule[];

  constructor(rules: StrictTicketViewWindowRule[]) {
    this.rules = rules;
  }

  validate(item: StrictTicketViewWindow): string[] {
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

  requireValid(item: StrictTicketViewWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictTicketViewWindow[]): Map<string, string[]> {
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

export function defaultStrictTicketViewWindowValidator(): StrictTicketViewWindowValidator {
  return new StrictTicketViewWindowValidator(
    [
      new StrictTicketViewWindowRequiredCategoryRule("strict ticket view window needs an entry"),
      new StrictTicketViewWindowCategoryLengthRule(16),
      new StrictTicketViewWindowCodePrefixRule("ACM"),
      new StrictTicketViewWindowGraceDaysRangeRule(16, 1000),
      new StrictTicketViewWindowTagsLimitRule(16, ["batched"]),
    ],
  );
}
