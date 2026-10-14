import { ApprovalEntry } from "./approval-entry.js";

/** A rule a approval entry must pass. Check returns its problems, or none. */
export interface ApprovalEntryRule {
  check(item: ApprovalEntry): string[];
}

export class ApprovalEntryUpdatedAtRangeRule implements ApprovalEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalEntry): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ApprovalEntryTagsLimitRule implements ApprovalEntryRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ApprovalEntry): string[] {
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

export class ApprovalEntryActiveGuardRule implements ApprovalEntryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ApprovalEntry): string[] {
    if (item.active && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while active`];
    return [];
  }
}

export class ApprovalEntryVersionRangeRule implements ApprovalEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalEntry): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ApprovalEntryRequiredLocaleRule implements ApprovalEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalEntry): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a approval entry. */
export class ApprovalEntryValidator {
  rules: ApprovalEntryRule[];

  constructor(rules: ApprovalEntryRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalEntry): string[] {
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

  requireValid(item: ApprovalEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalEntry[]): Map<string, string[]> {
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

export function defaultApprovalEntryValidator(): ApprovalEntryValidator {
  return new ApprovalEntryValidator(
    [
      new ApprovalEntryUpdatedAtRangeRule(120, 1000),
      new ApprovalEntryTagsLimitRule(3600, ["capped"]),
      new ApprovalEntryActiveGuardRule(64),
      new ApprovalEntryVersionRangeRule(32, 64),
      new ApprovalEntryRequiredLocaleRule("approval entry needs a value"),
    ],
  );
}
