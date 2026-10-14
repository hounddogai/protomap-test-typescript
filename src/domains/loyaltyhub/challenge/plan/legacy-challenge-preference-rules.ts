import { LegacyChallengePreference } from "./legacy-challenge-preference.js";

/** A rule a legacy challenge preference must pass. Check returns its problems, or none. */
export interface LegacyChallengePreferenceRule {
  check(item: LegacyChallengePreference): string[];
}

export class LegacyChallengePreferenceCodePrefixRule implements LegacyChallengePreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyChallengePreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyChallengePreferenceRequiredTitleRule implements LegacyChallengePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyChallengePreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyChallengePreferenceRequiredOwnerIdRule implements LegacyChallengePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyChallengePreference): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy challenge preference. */
export class LegacyChallengePreferenceValidator {
  rules: LegacyChallengePreferenceRule[];

  constructor(rules: LegacyChallengePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyChallengePreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyChallengePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyChallengePreference[]): Map<string, string[]> {
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

export function defaultLegacyChallengePreferenceValidator(): LegacyChallengePreferenceValidator {
  return new LegacyChallengePreferenceValidator(
    [
      new LegacyChallengePreferenceCodePrefixRule("REF"),
      new LegacyChallengePreferenceRequiredTitleRule("legacy challenge preference needs an entry"),
      new LegacyChallengePreferenceRequiredOwnerIdRule("legacy challenge preference needs a value"),
    ],
  );
}
