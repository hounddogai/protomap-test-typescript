import { RollingLeaderboardTemplate } from "./rolling-leaderboard-template.js";

/** A rule a rolling leaderboard template must pass. Check returns its problems, or none. */
export interface RollingLeaderboardTemplateRule {
  check(item: RollingLeaderboardTemplate): string[];
}

export class RollingLeaderboardTemplateCodeLengthRule implements RollingLeaderboardTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingLeaderboardTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingLeaderboardTemplateMarginRangeRule implements RollingLeaderboardTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingLeaderboardTemplate): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingLeaderboardTemplateUtmSourceLengthRule implements RollingLeaderboardTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingLeaderboardTemplate): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingLeaderboardTemplateContactEmailLengthRule implements RollingLeaderboardTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingLeaderboardTemplate): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingLeaderboardTemplateRequiredContactEmailRule implements RollingLeaderboardTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingLeaderboardTemplate): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class RollingLeaderboardTemplateRequiredCodeRule implements RollingLeaderboardTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingLeaderboardTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling leaderboard template. */
export class RollingLeaderboardTemplateValidator {
  rules: RollingLeaderboardTemplateRule[];

  constructor(rules: RollingLeaderboardTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: RollingLeaderboardTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingLeaderboardTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingLeaderboardTemplate[]): Map<string, string[]> {
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

export function defaultRollingLeaderboardTemplateValidator(): RollingLeaderboardTemplateValidator {
  return new RollingLeaderboardTemplateValidator(
    [
      new RollingLeaderboardTemplateCodeLengthRule(80),
      new RollingLeaderboardTemplateMarginRangeRule(3.4, 937.7),
      new RollingLeaderboardTemplateUtmSourceLengthRule(32),
      new RollingLeaderboardTemplateContactEmailLengthRule(255),
      new RollingLeaderboardTemplateRequiredContactEmailRule("rolling leaderboard template needs an entry"),
      new RollingLeaderboardTemplateRequiredCodeRule("rolling leaderboard template needs this field"),
    ],
  );
}
