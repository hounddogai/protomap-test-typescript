import * as text from "../../../../kit/text.js";
import { GlobalBranchDigest } from "./global-branch-digest.js";

/** A rule a global branch digest must pass. Check returns its problems, or none. */
export interface GlobalBranchDigestRule {
  check(item: GlobalBranchDigest): string[];
}

export class GlobalBranchDigestRequiredLabelRule implements GlobalBranchDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalBranchDigest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalBranchDigestTagsLimitRule implements GlobalBranchDigestRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: GlobalBranchDigest): string[] {
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

export class GlobalBranchDigestAllowedLabelRule implements GlobalBranchDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalBranchDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is stale`];
    return [];
  }
}

export class GlobalBranchDigestVersionRangeRule implements GlobalBranchDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalBranchDigest): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalBranchDigestRequiredCodeRule implements GlobalBranchDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalBranchDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global branch digest. */
export class GlobalBranchDigestValidator {
  rules: GlobalBranchDigestRule[];

  constructor(rules: GlobalBranchDigestRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalBranchDigest): string[] {
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

  requireValid(item: GlobalBranchDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalBranchDigest[]): Map<string, string[]> {
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

export function defaultGlobalBranchDigestValidator(): GlobalBranchDigestValidator {
  return new GlobalBranchDigestValidator(
    [
      new GlobalBranchDigestRequiredLabelRule("global branch digest needs an entry"),
      new GlobalBranchDigestTagsLimitRule(255, ["global", "global"]),
      new GlobalBranchDigestAllowedLabelRule(["regional", "manual", "lenient"]),
      new GlobalBranchDigestVersionRangeRule(64, 86400),
      new GlobalBranchDigestRequiredCodeRule("global branch digest needs an entry"),
    ],
  );
}
