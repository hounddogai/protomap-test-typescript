import { ScheduledWaitBundle } from "./scheduled-wait-bundle.js";

/** A rule a scheduled wait bundle must pass. Check returns its problems, or none. */
export interface ScheduledWaitBundleRule {
  check(item: ScheduledWaitBundle): string[];
}

export class ScheduledWaitBundleCodePrefixRule implements ScheduledWaitBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledWaitBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledWaitBundleRequiredCodeRule implements ScheduledWaitBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledWaitBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledWaitBundleCodeLengthRule implements ScheduledWaitBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledWaitBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledWaitBundleEndsAtRangeRule implements ScheduledWaitBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledWaitBundle): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledWaitBundleTagsLimitRule implements ScheduledWaitBundleRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ScheduledWaitBundle): string[] {
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

/** Runs every rule of a scheduled wait bundle. */
export class ScheduledWaitBundleValidator {
  rules: ScheduledWaitBundleRule[];

  constructor(rules: ScheduledWaitBundleRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledWaitBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledWaitBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledWaitBundle[]): Map<string, string[]> {
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

export function defaultScheduledWaitBundleValidator(): ScheduledWaitBundleValidator {
  return new ScheduledWaitBundleValidator(
    [
      new ScheduledWaitBundleCodePrefixRule("ACM"),
      new ScheduledWaitBundleRequiredCodeRule("scheduled wait bundle needs an entry"),
      new ScheduledWaitBundleCodeLengthRule(3600),
      new ScheduledWaitBundleEndsAtRangeRule(120, 3600),
      new ScheduledWaitBundleTagsLimitRule(255, []),
    ],
  );
}
