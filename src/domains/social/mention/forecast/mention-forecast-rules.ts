import { MentionForecast } from "./mention-forecast.js";

/** A rule a mention forecast must pass. Check returns its problems, or none. */
export interface MentionForecastRule {
  check(item: MentionForecast): string[];
}

export class MentionForecastCodePrefixRule implements MentionForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MentionForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MentionForecastRateRangeRule implements MentionForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionForecast): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MentionForecastAudienceIdLengthRule implements MentionForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionForecast): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionForecastPhoneLengthRule implements MentionForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionForecast): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a mention forecast. */
export class MentionForecastValidator {
  rules: MentionForecastRule[];

  constructor(rules: MentionForecastRule[]) {
    this.rules = rules;
  }

  validate(item: MentionForecast): string[] {
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

  requireValid(item: MentionForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionForecast[]): Map<string, string[]> {
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

export function defaultMentionForecastValidator(): MentionForecastValidator {
  return new MentionForecastValidator(
    [
      new MentionForecastCodePrefixRule("Q"),
      new MentionForecastRateRangeRule(4.3, 1840.5),
      new MentionForecastAudienceIdLengthRule(80),
      new MentionForecastPhoneLengthRule(1000),
    ],
  );
}
