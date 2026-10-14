import { WarmupPreference } from "./warmup-preference.js";

/** A rule a warmup preference must pass. Check returns its problems, or none. */
export interface WarmupPreferenceRule {
  check(item: WarmupPreference): string[];
}

export class WarmupPreferenceRequiredDescriptionRule implements WarmupPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupPreference): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupPreferenceCodePrefixRule implements WarmupPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WarmupPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WarmupPreferenceDescriptionLengthRule implements WarmupPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupPreference): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a warmup preference. */
export class WarmupPreferenceValidator {
  rules: WarmupPreferenceRule[];

  constructor(rules: WarmupPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupPreference): string[] {
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

  requireValid(item: WarmupPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupPreference[]): Map<string, string[]> {
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

export function defaultWarmupPreferenceValidator(): WarmupPreferenceValidator {
  return new WarmupPreferenceValidator(
    [
      new WarmupPreferenceRequiredDescriptionRule("warmup preference needs a value"),
      new WarmupPreferenceCodePrefixRule("REF"),
      new WarmupPreferenceDescriptionLengthRule(120),
    ],
  );
}
