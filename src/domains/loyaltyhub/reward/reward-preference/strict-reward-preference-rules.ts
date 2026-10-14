import * as text from "../../../../kit/text.js";
import { StrictRewardPreference } from "./strict-reward-preference.js";

/** A rule a strict reward preference must pass. Check returns its problems, or none. */
export interface StrictRewardPreferenceRule {
  check(item: StrictRewardPreference): string[];
}

export class StrictRewardPreferenceAllowedCodeRule implements StrictRewardPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictRewardPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class StrictRewardPreferenceRequiredUnitRule implements StrictRewardPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRewardPreference): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRewardPreferenceTitleLengthRule implements StrictRewardPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRewardPreference): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRewardPreferenceArchivedGuardRule implements StrictRewardPreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictRewardPreference): string[] {
    if (item.archived && item.batchSize > this.limit) return [`batch size ${item.batchSize} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class StrictRewardPreferenceRequiredTitleRule implements StrictRewardPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRewardPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict reward preference. */
export class StrictRewardPreferenceValidator {
  rules: StrictRewardPreferenceRule[];

  constructor(rules: StrictRewardPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: StrictRewardPreference): string[] {
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

  requireValid(item: StrictRewardPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictRewardPreference[]): Map<string, string[]> {
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

export function defaultStrictRewardPreferenceValidator(): StrictRewardPreferenceValidator {
  return new StrictRewardPreferenceValidator(
    [
      new StrictRewardPreferenceAllowedCodeRule(["scheduled"]),
      new StrictRewardPreferenceRequiredUnitRule("strict reward preference needs this field"),
      new StrictRewardPreferenceTitleLengthRule(86400),
      new StrictRewardPreferenceArchivedGuardRule(255),
      new StrictRewardPreferenceRequiredTitleRule("strict reward preference needs a value"),
    ],
  );
}
