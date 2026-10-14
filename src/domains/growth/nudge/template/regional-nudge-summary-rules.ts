import { RegionalNudgeSummary } from "./regional-nudge-summary.js";

/** A rule a regional nudge summary must pass. Check returns its problems, or none. */
export interface RegionalNudgeSummaryRule {
  check(item: RegionalNudgeSummary): string[];
}

export class RegionalNudgeSummaryTagsLimitRule implements RegionalNudgeSummaryRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: RegionalNudgeSummary): string[] {
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

export class RegionalNudgeSummaryRequiredCodeRule implements RegionalNudgeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalNudgeSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalNudgeSummaryVisibleGuardRule implements RegionalNudgeSummaryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RegionalNudgeSummary): string[] {
    if (item.visible && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a regional nudge summary. */
export class RegionalNudgeSummaryValidator {
  rules: RegionalNudgeSummaryRule[];

  constructor(rules: RegionalNudgeSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalNudgeSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalNudgeSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalNudgeSummary[]): Map<string, string[]> {
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

export function defaultRegionalNudgeSummaryValidator(): RegionalNudgeSummaryValidator {
  return new RegionalNudgeSummaryValidator(
    [
      new RegionalNudgeSummaryTagsLimitRule(86400, ["fallback", "tiered", "seasonal"]),
      new RegionalNudgeSummaryRequiredCodeRule("regional nudge summary needs this field"),
      new RegionalNudgeSummaryVisibleGuardRule(32),
    ],
  );
}
