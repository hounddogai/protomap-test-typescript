import * as text from "../../../../kit/text.js";
import { PreferenceProfile } from "./preference-profile.js";

/** A rule a preference profile must pass. Check returns its problems, or none. */
export interface PreferenceProfileRule {
  check(item: PreferenceProfile): string[];
}

export class PreferenceProfileRequiredCohortRule implements PreferenceProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceProfile): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceProfileChannelLengthRule implements PreferenceProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceProfile): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceProfileAllowedNameRule implements PreferenceProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PreferenceProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is unknown`];
    return [];
  }
}

export class PreferenceProfileRequiredNameRule implements PreferenceProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceProfile): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceProfileNameLengthRule implements PreferenceProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceProfile): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a preference profile. */
export class PreferenceProfileValidator {
  rules: PreferenceProfileRule[];

  constructor(rules: PreferenceProfileRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceProfile): string[] {
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

  requireValid(item: PreferenceProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceProfile[]): Map<string, string[]> {
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

export function defaultPreferenceProfileValidator(): PreferenceProfileValidator {
  return new PreferenceProfileValidator(
    [
      new PreferenceProfileRequiredCohortRule("preference profile needs a value"),
      new PreferenceProfileChannelLengthRule(16),
      new PreferenceProfileAllowedNameRule(["manual"]),
      new PreferenceProfileRequiredNameRule("preference profile needs an entry"),
      new PreferenceProfileNameLengthRule(120),
    ],
  );
}
