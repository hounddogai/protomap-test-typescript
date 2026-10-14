import { LegacyReplyDigest } from "./legacy-reply-digest.js";

/** A rule a legacy reply digest must pass. Check returns its problems, or none. */
export interface LegacyReplyDigestRule {
  check(item: LegacyReplyDigest): string[];
}

export class LegacyReplyDigestCodePrefixRule implements LegacyReplyDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyReplyDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyReplyDigestLocaleLengthRule implements LegacyReplyDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyReplyDigest): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyReplyDigestTitleLengthRule implements LegacyReplyDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyReplyDigest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyReplyDigestTagsLimitRule implements LegacyReplyDigestRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: LegacyReplyDigest): string[] {
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

export class LegacyReplyDigestCodeLengthRule implements LegacyReplyDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyReplyDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyReplyDigestCategoryLengthRule implements LegacyReplyDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyReplyDigest): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy reply digest. */
export class LegacyReplyDigestValidator {
  rules: LegacyReplyDigestRule[];

  constructor(rules: LegacyReplyDigestRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyReplyDigest): string[] {
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

  requireValid(item: LegacyReplyDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyReplyDigest[]): Map<string, string[]> {
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

export function defaultLegacyReplyDigestValidator(): LegacyReplyDigestValidator {
  return new LegacyReplyDigestValidator(
    [
      new LegacyReplyDigestCodePrefixRule("OPS"),
      new LegacyReplyDigestLocaleLengthRule(255),
      new LegacyReplyDigestTitleLengthRule(1000),
      new LegacyReplyDigestTagsLimitRule(80, ["scheduled", "adaptive", "manual"]),
      new LegacyReplyDigestCodeLengthRule(64),
      new LegacyReplyDigestCategoryLengthRule(86400),
    ],
  );
}
