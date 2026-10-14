import { CreativePreference } from "./creative-preference.js";

/** A rule a creative preference must pass. Check returns its problems, or none. */
export interface CreativePreferenceRule {
  check(item: CreativePreference): string[];
}

export class CreativePreferenceBidRangeRule implements CreativePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativePreference): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreativePreferenceActiveGuardRule implements CreativePreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CreativePreference): string[] {
    if (item.active && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while active`];
    return [];
  }
}

export class CreativePreferenceCodeLengthRule implements CreativePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativePreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativePreferenceRequiredSourceRule implements CreativePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativePreference): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class CreativePreferenceLabelLengthRule implements CreativePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativePreference): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativePreferenceRequiredLabelRule implements CreativePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativePreference): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a creative preference. */
export class CreativePreferenceValidator {
  rules: CreativePreferenceRule[];

  constructor(rules: CreativePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: CreativePreference): string[] {
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

  requireValid(item: CreativePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativePreference[]): Map<string, string[]> {
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

export function defaultCreativePreferenceValidator(): CreativePreferenceValidator {
  return new CreativePreferenceValidator(
    [
      new CreativePreferenceBidRangeRule(5.2, 3215),
      new CreativePreferenceActiveGuardRule(4.2),
      new CreativePreferenceCodeLengthRule(80),
      new CreativePreferenceRequiredSourceRule("creative preference needs an entry"),
      new CreativePreferenceLabelLengthRule(120),
      new CreativePreferenceRequiredLabelRule("creative preference needs a value"),
    ],
  );
}
