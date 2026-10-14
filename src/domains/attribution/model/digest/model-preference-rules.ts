import { ModelPreference } from "./model-preference.js";

/** A rule a model preference must pass. Check returns its problems, or none. */
export interface ModelPreferenceRule {
  check(item: ModelPreference): string[];
}

export class ModelPreferenceRequiredChannelRule implements ModelPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelPreference): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class ModelPreferenceMaximumRangeRule implements ModelPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelPreference): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ModelPreferenceCodeLengthRule implements ModelPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a model preference. */
export class ModelPreferenceValidator {
  rules: ModelPreferenceRule[];

  constructor(rules: ModelPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: ModelPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelPreference[]): Map<string, string[]> {
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

export function defaultModelPreferenceValidator(): ModelPreferenceValidator {
  return new ModelPreferenceValidator(
    [
      new ModelPreferenceRequiredChannelRule("model preference needs a value"),
      new ModelPreferenceMaximumRangeRule(6.8, 4942.7),
      new ModelPreferenceCodeLengthRule(255),
    ],
  );
}
