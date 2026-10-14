import { ManualPostSnapshot } from "./manual-post-snapshot.js";

/** A rule a manual post snapshot must pass. Check returns its problems, or none. */
export interface ManualPostSnapshotRule {
  check(item: ManualPostSnapshot): string[];
}

export class ManualPostSnapshotCodePrefixRule implements ManualPostSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualPostSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualPostSnapshotTagsLimitRule implements ManualPostSnapshotRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ManualPostSnapshot): string[] {
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

export class ManualPostSnapshotApprovedGuardRule implements ManualPostSnapshotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ManualPostSnapshot): string[] {
    if (item.approved && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class ManualPostSnapshotPriorityRangeRule implements ManualPostSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPostSnapshot): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualPostSnapshotAttemptsRangeRule implements ManualPostSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPostSnapshot): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualPostSnapshotRequiredTimezoneRule implements ManualPostSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPostSnapshot): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual post snapshot. */
export class ManualPostSnapshotValidator {
  rules: ManualPostSnapshotRule[];

  constructor(rules: ManualPostSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPostSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualPostSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPostSnapshot[]): Map<string, string[]> {
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

export function defaultManualPostSnapshotValidator(): ManualPostSnapshotValidator {
  return new ManualPostSnapshotValidator(
    [
      new ManualPostSnapshotCodePrefixRule("X"),
      new ManualPostSnapshotTagsLimitRule(120, []),
      new ManualPostSnapshotApprovedGuardRule(1000),
      new ManualPostSnapshotPriorityRangeRule(64, 120),
      new ManualPostSnapshotAttemptsRangeRule(80, 120),
      new ManualPostSnapshotRequiredTimezoneRule("manual post snapshot needs this field"),
    ],
  );
}
