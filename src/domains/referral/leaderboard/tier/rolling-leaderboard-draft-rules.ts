import { RollingLeaderboardDraft } from "./rolling-leaderboard-draft.js";

/** A rule a rolling leaderboard draft must pass. Check returns its problems, or none. */
export interface RollingLeaderboardDraftRule {
  check(item: RollingLeaderboardDraft): string[];
}

export class RollingLeaderboardDraftRegionLengthRule implements RollingLeaderboardDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingLeaderboardDraft): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingLeaderboardDraftRequiredSummaryRule implements RollingLeaderboardDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingLeaderboardDraft): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class RollingLeaderboardDraftCodeLengthRule implements RollingLeaderboardDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingLeaderboardDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingLeaderboardDraftCodePrefixRule implements RollingLeaderboardDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingLeaderboardDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a rolling leaderboard draft. */
export class RollingLeaderboardDraftValidator {
  rules: RollingLeaderboardDraftRule[];

  constructor(rules: RollingLeaderboardDraftRule[]) {
    this.rules = rules;
  }

  validate(item: RollingLeaderboardDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingLeaderboardDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingLeaderboardDraft[]): Map<string, string[]> {
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

export function defaultRollingLeaderboardDraftValidator(): RollingLeaderboardDraftValidator {
  return new RollingLeaderboardDraftValidator(
    [
      new RollingLeaderboardDraftRegionLengthRule(16),
      new RollingLeaderboardDraftRequiredSummaryRule("rolling leaderboard draft needs a value"),
      new RollingLeaderboardDraftCodeLengthRule(80),
      new RollingLeaderboardDraftCodePrefixRule("OPS"),
    ],
  );
}
