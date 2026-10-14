import { SeasonalPreferenceThreshold } from "./seasonal-preference-threshold.js";

/** A rule a seasonal preference threshold must pass. Check returns its problems, or none. */
export interface SeasonalPreferenceThresholdRule {
  check(item: SeasonalPreferenceThreshold): string[];
}

export class SeasonalPreferenceThresholdRequiredContactEmailRule implements SeasonalPreferenceThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPreferenceThreshold): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalPreferenceThresholdLabelLengthRule implements SeasonalPreferenceThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPreferenceThreshold): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalPreferenceThresholdContactEmailLengthRule implements SeasonalPreferenceThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPreferenceThreshold): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalPreferenceThresholdCodePrefixRule implements SeasonalPreferenceThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalPreferenceThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a seasonal preference threshold. */
export class SeasonalPreferenceThresholdValidator {
  rules: SeasonalPreferenceThresholdRule[];

  constructor(rules: SeasonalPreferenceThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalPreferenceThreshold): string[] {
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

  requireValid(item: SeasonalPreferenceThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalPreferenceThreshold[]): Map<string, string[]> {
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

export function defaultSeasonalPreferenceThresholdValidator(): SeasonalPreferenceThresholdValidator {
  return new SeasonalPreferenceThresholdValidator(
    [
      new SeasonalPreferenceThresholdRequiredContactEmailRule("seasonal preference threshold needs a value"),
      new SeasonalPreferenceThresholdLabelLengthRule(3600),
      new SeasonalPreferenceThresholdContactEmailLengthRule(32),
      new SeasonalPreferenceThresholdCodePrefixRule("X"),
    ],
  );
}
