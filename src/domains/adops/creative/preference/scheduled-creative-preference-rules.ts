import { ScheduledCreativePreference } from "./scheduled-creative-preference.js";

/** A rule a scheduled creative preference must pass. Check returns its problems, or none. */
export interface ScheduledCreativePreferenceRule {
  check(item: ScheduledCreativePreference): string[];
}

export class ScheduledCreativePreferenceCodeLengthRule implements ScheduledCreativePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledCreativePreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledCreativePreferenceApprovedGuardRule implements ScheduledCreativePreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ScheduledCreativePreference): string[] {
    if (item.approved && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class ScheduledCreativePreferenceRequiredCodeRule implements ScheduledCreativePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledCreativePreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledCreativePreferenceRequiredCampaignRefRule implements ScheduledCreativePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledCreativePreference): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledCreativePreferenceCodePrefixRule implements ScheduledCreativePreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledCreativePreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a scheduled creative preference. */
export class ScheduledCreativePreferenceValidator {
  rules: ScheduledCreativePreferenceRule[];

  constructor(rules: ScheduledCreativePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledCreativePreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledCreativePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledCreativePreference[]): Map<string, string[]> {
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

export function defaultScheduledCreativePreferenceValidator(): ScheduledCreativePreferenceValidator {
  return new ScheduledCreativePreferenceValidator(
    [
      new ScheduledCreativePreferenceCodeLengthRule(86400),
      new ScheduledCreativePreferenceApprovedGuardRule(64),
      new ScheduledCreativePreferenceRequiredCodeRule("scheduled creative preference needs an entry"),
      new ScheduledCreativePreferenceRequiredCampaignRefRule("scheduled creative preference needs a value"),
      new ScheduledCreativePreferenceCodePrefixRule("X"),
    ],
  );
}
