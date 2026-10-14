import * as text from "../../../../kit/text.js";
import { LegacyChallengeOverride } from "./legacy-challenge-override.js";

/** A rule a legacy challenge override must pass. Check returns its problems, or none. */
export interface LegacyChallengeOverrideRule {
  check(item: LegacyChallengeOverride): string[];
}

export class LegacyChallengeOverrideArchivedGuardRule implements LegacyChallengeOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyChallengeOverride): string[] {
    if (item.archived && item.bid > this.limit) return [`bid ${item.bid} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class LegacyChallengeOverrideRequiredTitleRule implements LegacyChallengeOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyChallengeOverride): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyChallengeOverrideAllowedCodeRule implements LegacyChallengeOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyChallengeOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class LegacyChallengeOverrideRequiredCodeRule implements LegacyChallengeOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyChallengeOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyChallengeOverrideMaximumRangeRule implements LegacyChallengeOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyChallengeOverride): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy challenge override. */
export class LegacyChallengeOverrideValidator {
  rules: LegacyChallengeOverrideRule[];

  constructor(rules: LegacyChallengeOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyChallengeOverride): string[] {
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

  requireValid(item: LegacyChallengeOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyChallengeOverride[]): Map<string, string[]> {
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

export function defaultLegacyChallengeOverrideValidator(): LegacyChallengeOverrideValidator {
  return new LegacyChallengeOverrideValidator(
    [
      new LegacyChallengeOverrideArchivedGuardRule(4.2),
      new LegacyChallengeOverrideRequiredTitleRule("legacy challenge override needs an entry"),
      new LegacyChallengeOverrideAllowedCodeRule(["default", "weighted", "seasonal"]),
      new LegacyChallengeOverrideRequiredCodeRule("legacy challenge override needs this field"),
      new LegacyChallengeOverrideMaximumRangeRule(7, 4219.8),
    ],
  );
}
