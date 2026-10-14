import * as text from "../../../../kit/text.js";
import { SeasonalBouncePreference } from "./seasonal-bounce-preference.js";

/** A rule a seasonal bounce preference must pass. Check returns its problems, or none. */
export interface SeasonalBouncePreferenceRule {
  check(item: SeasonalBouncePreference): string[];
}

export class SeasonalBouncePreferenceNameLengthRule implements SeasonalBouncePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBouncePreference): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalBouncePreferenceRequiredContactEmailRule implements SeasonalBouncePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBouncePreference): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalBouncePreferenceAllowedSourceRule implements SeasonalBouncePreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalBouncePreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is blocked`];
    return [];
  }
}

export class SeasonalBouncePreferenceRequiredCodeRule implements SeasonalBouncePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBouncePreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalBouncePreferenceRequiredNameRule implements SeasonalBouncePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBouncePreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal bounce preference. */
export class SeasonalBouncePreferenceValidator {
  rules: SeasonalBouncePreferenceRule[];

  constructor(rules: SeasonalBouncePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalBouncePreference): string[] {
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

  requireValid(item: SeasonalBouncePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalBouncePreference[]): Map<string, string[]> {
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

export function defaultSeasonalBouncePreferenceValidator(): SeasonalBouncePreferenceValidator {
  return new SeasonalBouncePreferenceValidator(
    [
      new SeasonalBouncePreferenceNameLengthRule(1000),
      new SeasonalBouncePreferenceRequiredContactEmailRule("seasonal bounce preference needs an entry"),
      new SeasonalBouncePreferenceAllowedSourceRule(["seasonal"]),
      new SeasonalBouncePreferenceRequiredCodeRule("seasonal bounce preference needs an entry"),
      new SeasonalBouncePreferenceRequiredNameRule("seasonal bounce preference needs this field"),
    ],
  );
}
