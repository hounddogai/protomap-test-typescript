import { LenientPathPreference } from "./lenient-path-preference.js";

/** A rule a lenient path preference must pass. Check returns its problems, or none. */
export interface LenientPathPreferenceRule {
  check(item: LenientPathPreference): string[];
}

export class LenientPathPreferenceImpressionsRangeRule implements LenientPathPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPathPreference): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientPathPreferenceRequiredCodeRule implements LenientPathPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPathPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPathPreferenceTagsLimitRule implements LenientPathPreferenceRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: LenientPathPreference): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class LenientPathPreferenceCodePrefixRule implements LenientPathPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientPathPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a lenient path preference. */
export class LenientPathPreferenceValidator {
  rules: LenientPathPreferenceRule[];

  constructor(rules: LenientPathPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPathPreference): string[] {
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

  requireValid(item: LenientPathPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPathPreference[]): Map<string, string[]> {
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

export function defaultLenientPathPreferenceValidator(): LenientPathPreferenceValidator {
  return new LenientPathPreferenceValidator(
    [
      new LenientPathPreferenceImpressionsRangeRule(64, 80),
      new LenientPathPreferenceRequiredCodeRule("lenient path preference needs a value"),
      new LenientPathPreferenceTagsLimitRule(16, ["primary", "weighted"]),
      new LenientPathPreferenceCodePrefixRule("X"),
    ],
  );
}
