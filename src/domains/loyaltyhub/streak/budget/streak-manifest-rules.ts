import { StreakManifest } from "./streak-manifest.js";

/** A rule a streak manifest must pass. Check returns its problems, or none. */
export interface StreakManifestRule {
  check(item: StreakManifest): string[];
}

export class StreakManifestRequiredCodeRule implements StreakManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StreakManifestAudienceIdLengthRule implements StreakManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakManifest): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakManifestApprovedGuardRule implements StreakManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StreakManifest): string[] {
    if (item.approved && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class StreakManifestCountryLengthRule implements StreakManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakManifest): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a streak manifest. */
export class StreakManifestValidator {
  rules: StreakManifestRule[];

  constructor(rules: StreakManifestRule[]) {
    this.rules = rules;
  }

  validate(item: StreakManifest): string[] {
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

  requireValid(item: StreakManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakManifest[]): Map<string, string[]> {
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

export function defaultStreakManifestValidator(): StreakManifestValidator {
  return new StreakManifestValidator(
    [
      new StreakManifestRequiredCodeRule("streak manifest needs an entry"),
      new StreakManifestAudienceIdLengthRule(16),
      new StreakManifestApprovedGuardRule(9.4),
      new StreakManifestCountryLengthRule(120),
    ],
  );
}
