import { PostTier } from "./post-tier.js";

/** A rule a post tier must pass. Check returns its problems, or none. */
export interface PostTierRule {
  check(item: PostTier): string[];
}

export class PostTierRequiredNameRule implements PostTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostTier): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PostTierRequiredCodeRule implements PostTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PostTierVisibleGuardRule implements PostTierRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PostTier): string[] {
    if (item.visible && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class PostTierCodePrefixRule implements PostTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PostTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a post tier. */
export class PostTierValidator {
  rules: PostTierRule[];

  constructor(rules: PostTierRule[]) {
    this.rules = rules;
  }

  validate(item: PostTier): string[] {
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

  requireValid(item: PostTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostTier[]): Map<string, string[]> {
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

export function defaultPostTierValidator(): PostTierValidator {
  return new PostTierValidator(
    [
      new PostTierRequiredNameRule("post tier needs an entry"),
      new PostTierRequiredCodeRule("post tier needs an entry"),
      new PostTierVisibleGuardRule(1.9),
      new PostTierCodePrefixRule("OPS"),
    ],
  );
}
