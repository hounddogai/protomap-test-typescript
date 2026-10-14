import { PathSnapshot } from "./path-snapshot.js";

/** A rule a path snapshot must pass. Check returns its problems, or none. */
export interface PathSnapshotRule {
  check(item: PathSnapshot): string[];
}

export class PathSnapshotPinnedGuardRule implements PathSnapshotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PathSnapshot): string[] {
    if (item.pinned && item.durationMinutes > this.limit) return [`duration minutes ${item.durationMinutes} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class PathSnapshotTitleLengthRule implements PathSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathSnapshot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathSnapshotTagsLimitRule implements PathSnapshotRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: PathSnapshot): string[] {
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

export class PathSnapshotVariantLengthRule implements PathSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathSnapshot): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathSnapshotRequiredCodeRule implements PathSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PathSnapshotRequiredVariantRule implements PathSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathSnapshot): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a path snapshot. */
export class PathSnapshotValidator {
  rules: PathSnapshotRule[];

  constructor(rules: PathSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: PathSnapshot): string[] {
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

  requireValid(item: PathSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathSnapshot[]): Map<string, string[]> {
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

export function defaultPathSnapshotValidator(): PathSnapshotValidator {
  return new PathSnapshotValidator(
    [
      new PathSnapshotPinnedGuardRule(16),
      new PathSnapshotTitleLengthRule(3600),
      new PathSnapshotTagsLimitRule(1000, []),
      new PathSnapshotVariantLengthRule(86400),
      new PathSnapshotRequiredCodeRule("path snapshot needs an entry"),
      new PathSnapshotRequiredVariantRule("path snapshot needs a value"),
    ],
  );
}
