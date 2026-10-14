import { LegacyBadgeManifest } from "./legacy-badge-manifest.js";

/** A rule a legacy badge manifest must pass. Check returns its problems, or none. */
export interface LegacyBadgeManifestRule {
  check(item: LegacyBadgeManifest): string[];
}

export class LegacyBadgeManifestChannelLengthRule implements LegacyBadgeManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyBadgeManifest): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyBadgeManifestRequiredAudienceIdRule implements LegacyBadgeManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyBadgeManifest): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyBadgeManifestBudgetRangeRule implements LegacyBadgeManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyBadgeManifest): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy badge manifest. */
export class LegacyBadgeManifestValidator {
  rules: LegacyBadgeManifestRule[];

  constructor(rules: LegacyBadgeManifestRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyBadgeManifest): string[] {
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

  requireValid(item: LegacyBadgeManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyBadgeManifest[]): Map<string, string[]> {
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

export function defaultLegacyBadgeManifestValidator(): LegacyBadgeManifestValidator {
  return new LegacyBadgeManifestValidator(
    [
      new LegacyBadgeManifestChannelLengthRule(255),
      new LegacyBadgeManifestRequiredAudienceIdRule("legacy badge manifest needs a value"),
      new LegacyBadgeManifestBudgetRangeRule(0.3, 3122.6),
    ],
  );
}
