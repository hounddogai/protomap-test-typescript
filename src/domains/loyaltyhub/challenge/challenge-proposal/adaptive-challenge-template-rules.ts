import { AdaptiveChallengeTemplate } from "./adaptive-challenge-template.js";

/** A rule a adaptive challenge template must pass. Check returns its problems, or none. */
export interface AdaptiveChallengeTemplateRule {
  check(item: AdaptiveChallengeTemplate): string[];
}

export class AdaptiveChallengeTemplateMaximumRangeRule implements AdaptiveChallengeTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveChallengeTemplate): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveChallengeTemplateCeilingRangeRule implements AdaptiveChallengeTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveChallengeTemplate): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveChallengeTemplateRequiredCurrencyRule implements AdaptiveChallengeTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveChallengeTemplate): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveChallengeTemplateCurrencyLengthRule implements AdaptiveChallengeTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveChallengeTemplate): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive challenge template. */
export class AdaptiveChallengeTemplateValidator {
  rules: AdaptiveChallengeTemplateRule[];

  constructor(rules: AdaptiveChallengeTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveChallengeTemplate): string[] {
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

  requireValid(item: AdaptiveChallengeTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveChallengeTemplate[]): Map<string, string[]> {
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

export function defaultAdaptiveChallengeTemplateValidator(): AdaptiveChallengeTemplateValidator {
  return new AdaptiveChallengeTemplateValidator(
    [
      new AdaptiveChallengeTemplateMaximumRangeRule(7.9, 3548.5),
      new AdaptiveChallengeTemplateCeilingRangeRule(8.3, 565.9),
      new AdaptiveChallengeTemplateRequiredCurrencyRule("adaptive challenge template needs a value"),
      new AdaptiveChallengeTemplateCurrencyLengthRule(16),
    ],
  );
}
