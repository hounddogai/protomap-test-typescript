import { SeasonalChallengeQuota } from "./seasonal-challenge-quota.js";

/** A rule a seasonal challenge quota must pass. Check returns its problems, or none. */
export interface SeasonalChallengeQuotaRule {
  check(item: SeasonalChallengeQuota): string[];
}

export class SeasonalChallengeQuotaVisibleGuardRule implements SeasonalChallengeQuotaRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalChallengeQuota): string[] {
    if (item.visible && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class SeasonalChallengeQuotaRequiredNameRule implements SeasonalChallengeQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalChallengeQuota): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalChallengeQuotaExternalRefLengthRule implements SeasonalChallengeQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalChallengeQuota): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalChallengeQuotaTagsLimitRule implements SeasonalChallengeQuotaRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: SeasonalChallengeQuota): string[] {
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

/** Runs every rule of a seasonal challenge quota. */
export class SeasonalChallengeQuotaValidator {
  rules: SeasonalChallengeQuotaRule[];

  constructor(rules: SeasonalChallengeQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalChallengeQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalChallengeQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalChallengeQuota[]): Map<string, string[]> {
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

export function defaultSeasonalChallengeQuotaValidator(): SeasonalChallengeQuotaValidator {
  return new SeasonalChallengeQuotaValidator(
    [
      new SeasonalChallengeQuotaVisibleGuardRule(255),
      new SeasonalChallengeQuotaRequiredNameRule("seasonal challenge quota needs an entry"),
      new SeasonalChallengeQuotaExternalRefLengthRule(1000),
      new SeasonalChallengeQuotaTagsLimitRule(255, []),
    ],
  );
}
