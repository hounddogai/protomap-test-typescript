import { LegacyComplaintManifest } from "./legacy-complaint-manifest.js";

/** A rule a legacy complaint manifest must pass. Check returns its problems, or none. */
export interface LegacyComplaintManifestRule {
  check(item: LegacyComplaintManifest): string[];
}

export class LegacyComplaintManifestTitleLengthRule implements LegacyComplaintManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyComplaintManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyComplaintManifestDurationMinutesRangeRule implements LegacyComplaintManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyComplaintManifest): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyComplaintManifestTagsLimitRule implements LegacyComplaintManifestRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: LegacyComplaintManifest): string[] {
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

/** Runs every rule of a legacy complaint manifest. */
export class LegacyComplaintManifestValidator {
  rules: LegacyComplaintManifestRule[];

  constructor(rules: LegacyComplaintManifestRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyComplaintManifest): string[] {
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

  requireValid(item: LegacyComplaintManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyComplaintManifest[]): Map<string, string[]> {
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

export function defaultLegacyComplaintManifestValidator(): LegacyComplaintManifestValidator {
  return new LegacyComplaintManifestValidator(
    [
      new LegacyComplaintManifestTitleLengthRule(1000),
      new LegacyComplaintManifestDurationMinutesRangeRule(64, 255),
      new LegacyComplaintManifestTagsLimitRule(16, ["regional", "global"]),
    ],
  );
}
