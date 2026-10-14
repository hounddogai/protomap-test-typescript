import { PostDigest } from "./post-digest.js";

/** A rule a post digest must pass. Check returns its problems, or none. */
export interface PostDigestRule {
  check(item: PostDigest): string[];
}

export class PostDigestCodeLengthRule implements PostDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostDigestRequiredNameRule implements PostDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PostDigestRequiredUtmSourceRule implements PostDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostDigest): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class PostDigestArchivedGuardRule implements PostDigestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PostDigest): string[] {
    if (item.archived && item.retries > this.limit) return [`retries ${item.retries} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PostDigestTagsLimitRule implements PostDigestRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: PostDigest): string[] {
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

/** Runs every rule of a post digest. */
export class PostDigestValidator {
  rules: PostDigestRule[];

  constructor(rules: PostDigestRule[]) {
    this.rules = rules;
  }

  validate(item: PostDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostDigest[]): Map<string, string[]> {
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

export function defaultPostDigestValidator(): PostDigestValidator {
  return new PostDigestValidator(
    [
      new PostDigestCodeLengthRule(80),
      new PostDigestRequiredNameRule("post digest needs this field"),
      new PostDigestRequiredUtmSourceRule("post digest needs a value"),
      new PostDigestArchivedGuardRule(16),
      new PostDigestTagsLimitRule(3600, ["adaptive", "weighted"]),
    ],
  );
}
