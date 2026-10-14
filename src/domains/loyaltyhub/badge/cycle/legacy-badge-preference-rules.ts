import { LegacyBadgePreference } from "./legacy-badge-preference.js";

/** A rule a legacy badge preference must pass. Check returns its problems, or none. */
export interface LegacyBadgePreferenceRule {
  check(item: LegacyBadgePreference): string[];
}

export class LegacyBadgePreferenceVariantLengthRule implements LegacyBadgePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyBadgePreference): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyBadgePreferenceCodePrefixRule implements LegacyBadgePreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyBadgePreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyBadgePreferenceRequiredNameRule implements LegacyBadgePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyBadgePreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy badge preference. */
export class LegacyBadgePreferenceValidator {
  rules: LegacyBadgePreferenceRule[];

  constructor(rules: LegacyBadgePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyBadgePreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyBadgePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyBadgePreference[]): Map<string, string[]> {
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

export function defaultLegacyBadgePreferenceValidator(): LegacyBadgePreferenceValidator {
  return new LegacyBadgePreferenceValidator(
    [
      new LegacyBadgePreferenceVariantLengthRule(120),
      new LegacyBadgePreferenceCodePrefixRule("ACM"),
      new LegacyBadgePreferenceRequiredNameRule("legacy badge preference needs an entry"),
    ],
  );
}
