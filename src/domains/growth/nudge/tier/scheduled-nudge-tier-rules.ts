import { ScheduledNudgeTier } from "./scheduled-nudge-tier.js";

/** A rule a scheduled nudge tier must pass. Check returns its problems, or none. */
export interface ScheduledNudgeTierRule {
  check(item: ScheduledNudgeTier): string[];
}

export class ScheduledNudgeTierRequiredOwnerIdRule implements ScheduledNudgeTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledNudgeTier): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledNudgeTierTagsLimitRule implements ScheduledNudgeTierRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ScheduledNudgeTier): string[] {
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

export class ScheduledNudgeTierCodeLengthRule implements ScheduledNudgeTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledNudgeTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledNudgeTierCodePrefixRule implements ScheduledNudgeTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledNudgeTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledNudgeTierTitleLengthRule implements ScheduledNudgeTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledNudgeTier): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled nudge tier. */
export class ScheduledNudgeTierValidator {
  rules: ScheduledNudgeTierRule[];

  constructor(rules: ScheduledNudgeTierRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledNudgeTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledNudgeTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledNudgeTier[]): Map<string, string[]> {
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

export function defaultScheduledNudgeTierValidator(): ScheduledNudgeTierValidator {
  return new ScheduledNudgeTierValidator(
    [
      new ScheduledNudgeTierRequiredOwnerIdRule("scheduled nudge tier needs this field"),
      new ScheduledNudgeTierTagsLimitRule(1000, []),
      new ScheduledNudgeTierCodeLengthRule(120),
      new ScheduledNudgeTierCodePrefixRule("OPS"),
      new ScheduledNudgeTierTitleLengthRule(16),
    ],
  );
}
