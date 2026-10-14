import * as text from "../../../../kit/text.js";
import { LeaderboardTemplate } from "./leaderboard-template.js";

/** A rule a leaderboard template must pass. Check returns its problems, or none. */
export interface LeaderboardTemplateRule {
  check(item: LeaderboardTemplate): string[];
}

export class LeaderboardTemplateCodeLengthRule implements LeaderboardTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardTemplateRequiredNameRule implements LeaderboardTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardTemplateAllowedCodeRule implements LeaderboardTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LeaderboardTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class LeaderboardTemplateCodePrefixRule implements LeaderboardTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LeaderboardTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LeaderboardTemplateRequiredRegionRule implements LeaderboardTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardTemplate): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a leaderboard template. */
export class LeaderboardTemplateValidator {
  rules: LeaderboardTemplateRule[];

  constructor(rules: LeaderboardTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardTemplate): string[] {
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

  requireValid(item: LeaderboardTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardTemplate[]): Map<string, string[]> {
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

export function defaultLeaderboardTemplateValidator(): LeaderboardTemplateValidator {
  return new LeaderboardTemplateValidator(
    [
      new LeaderboardTemplateCodeLengthRule(120),
      new LeaderboardTemplateRequiredNameRule("leaderboard template needs an entry"),
      new LeaderboardTemplateAllowedCodeRule(["manual"]),
      new LeaderboardTemplateCodePrefixRule("ACM"),
      new LeaderboardTemplateRequiredRegionRule("leaderboard template needs a value"),
    ],
  );
}
