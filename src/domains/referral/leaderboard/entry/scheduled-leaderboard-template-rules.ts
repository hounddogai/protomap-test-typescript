import { ScheduledLeaderboardTemplate } from "./scheduled-leaderboard-template.js";

/** A rule a scheduled leaderboard template must pass. Check returns its problems, or none. */
export interface ScheduledLeaderboardTemplateRule {
  check(item: ScheduledLeaderboardTemplate): string[];
}

export class ScheduledLeaderboardTemplateCategoryLengthRule implements ScheduledLeaderboardTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledLeaderboardTemplate): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledLeaderboardTemplateCodeLengthRule implements ScheduledLeaderboardTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledLeaderboardTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledLeaderboardTemplateChannelLengthRule implements ScheduledLeaderboardTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledLeaderboardTemplate): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledLeaderboardTemplateRequiredCategoryRule implements ScheduledLeaderboardTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledLeaderboardTemplate): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled leaderboard template. */
export class ScheduledLeaderboardTemplateValidator {
  rules: ScheduledLeaderboardTemplateRule[];

  constructor(rules: ScheduledLeaderboardTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledLeaderboardTemplate): string[] {
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

  requireValid(item: ScheduledLeaderboardTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledLeaderboardTemplate[]): Map<string, string[]> {
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

export function defaultScheduledLeaderboardTemplateValidator(): ScheduledLeaderboardTemplateValidator {
  return new ScheduledLeaderboardTemplateValidator(
    [
      new ScheduledLeaderboardTemplateCategoryLengthRule(32),
      new ScheduledLeaderboardTemplateCodeLengthRule(1000),
      new ScheduledLeaderboardTemplateChannelLengthRule(3600),
      new ScheduledLeaderboardTemplateRequiredCategoryRule("scheduled leaderboard template needs an entry"),
    ],
  );
}
