import { AdaptiveMacroPreference } from "./adaptive-macro-preference.js";

/** A rule a adaptive macro preference must pass. Check returns its problems, or none. */
export interface AdaptiveMacroPreferenceRule {
  check(item: AdaptiveMacroPreference): string[];
}

export class AdaptiveMacroPreferenceCodePrefixRule implements AdaptiveMacroPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveMacroPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveMacroPreferenceCodeLengthRule implements AdaptiveMacroPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveMacroPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveMacroPreferenceRequiredLabelRule implements AdaptiveMacroPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveMacroPreference): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveMacroPreferenceSummaryLengthRule implements AdaptiveMacroPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveMacroPreference): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveMacroPreferenceRequiredNameRule implements AdaptiveMacroPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveMacroPreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive macro preference. */
export class AdaptiveMacroPreferenceValidator {
  rules: AdaptiveMacroPreferenceRule[];

  constructor(rules: AdaptiveMacroPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveMacroPreference): string[] {
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

  requireValid(item: AdaptiveMacroPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveMacroPreference[]): Map<string, string[]> {
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

export function defaultAdaptiveMacroPreferenceValidator(): AdaptiveMacroPreferenceValidator {
  return new AdaptiveMacroPreferenceValidator(
    [
      new AdaptiveMacroPreferenceCodePrefixRule("Q"),
      new AdaptiveMacroPreferenceCodeLengthRule(80),
      new AdaptiveMacroPreferenceRequiredLabelRule("adaptive macro preference needs an entry"),
      new AdaptiveMacroPreferenceSummaryLengthRule(255),
      new AdaptiveMacroPreferenceRequiredNameRule("adaptive macro preference needs an entry"),
    ],
  );
}
