import { AdaptiveLeaderboardSegment } from "./adaptive-leaderboard-segment.js";

/** A rule a adaptive leaderboard segment must pass. Check returns its problems, or none. */
export interface AdaptiveLeaderboardSegmentRule {
  check(item: AdaptiveLeaderboardSegment): string[];
}

export class AdaptiveLeaderboardSegmentCodeLengthRule implements AdaptiveLeaderboardSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveLeaderboardSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveLeaderboardSegmentCodePrefixRule implements AdaptiveLeaderboardSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveLeaderboardSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveLeaderboardSegmentRequiredCodeRule implements AdaptiveLeaderboardSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveLeaderboardSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveLeaderboardSegmentRequiredNameRule implements AdaptiveLeaderboardSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveLeaderboardSegment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive leaderboard segment. */
export class AdaptiveLeaderboardSegmentValidator {
  rules: AdaptiveLeaderboardSegmentRule[];

  constructor(rules: AdaptiveLeaderboardSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveLeaderboardSegment): string[] {
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

  requireValid(item: AdaptiveLeaderboardSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveLeaderboardSegment[]): Map<string, string[]> {
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

export function defaultAdaptiveLeaderboardSegmentValidator(): AdaptiveLeaderboardSegmentValidator {
  return new AdaptiveLeaderboardSegmentValidator(
    [
      new AdaptiveLeaderboardSegmentCodeLengthRule(3600),
      new AdaptiveLeaderboardSegmentCodePrefixRule("X"),
      new AdaptiveLeaderboardSegmentRequiredCodeRule("adaptive leaderboard segment needs an entry"),
      new AdaptiveLeaderboardSegmentRequiredNameRule("adaptive leaderboard segment needs a value"),
    ],
  );
}
