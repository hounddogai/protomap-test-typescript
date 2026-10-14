import { PreferenceMapping } from "./preference-mapping.js";

/** A rule a preference mapping must pass. Check returns its problems, or none. */
export interface PreferenceMappingRule {
  check(item: PreferenceMapping): string[];
}

export class PreferenceMappingNameLengthRule implements PreferenceMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceMapping): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceMappingConversionRateRangeRule implements PreferenceMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceMapping): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceMappingTitleLengthRule implements PreferenceMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceMapping): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceMappingRequiredAudienceIdRule implements PreferenceMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceMapping): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceMappingDiscountRangeRule implements PreferenceMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceMapping): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a preference mapping. */
export class PreferenceMappingValidator {
  rules: PreferenceMappingRule[];

  constructor(rules: PreferenceMappingRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceMapping): string[] {
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

  requireValid(item: PreferenceMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceMapping[]): Map<string, string[]> {
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

export function defaultPreferenceMappingValidator(): PreferenceMappingValidator {
  return new PreferenceMappingValidator(
    [
      new PreferenceMappingNameLengthRule(64),
      new PreferenceMappingConversionRateRangeRule(2.5, 1839.1),
      new PreferenceMappingTitleLengthRule(1000),
      new PreferenceMappingRequiredAudienceIdRule("preference mapping needs an entry"),
      new PreferenceMappingDiscountRangeRule(0, 1810.7),
    ],
  );
}
