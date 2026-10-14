import { GlobalLeaderboardPlan } from "./global-leaderboard-plan.js";

/** A rule a global leaderboard plan must pass. Check returns its problems, or none. */
export interface GlobalLeaderboardPlanRule {
  check(item: GlobalLeaderboardPlan): string[];
}

export class GlobalLeaderboardPlanRequiredCodeRule implements GlobalLeaderboardPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalLeaderboardPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalLeaderboardPlanJourneyIdLengthRule implements GlobalLeaderboardPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalLeaderboardPlan): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalLeaderboardPlanRequiredCountryRule implements GlobalLeaderboardPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalLeaderboardPlan): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global leaderboard plan. */
export class GlobalLeaderboardPlanValidator {
  rules: GlobalLeaderboardPlanRule[];

  constructor(rules: GlobalLeaderboardPlanRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalLeaderboardPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalLeaderboardPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalLeaderboardPlan[]): Map<string, string[]> {
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

export function defaultGlobalLeaderboardPlanValidator(): GlobalLeaderboardPlanValidator {
  return new GlobalLeaderboardPlanValidator(
    [
      new GlobalLeaderboardPlanRequiredCodeRule("global leaderboard plan needs a value"),
      new GlobalLeaderboardPlanJourneyIdLengthRule(16),
      new GlobalLeaderboardPlanRequiredCountryRule("global leaderboard plan needs a value"),
    ],
  );
}
