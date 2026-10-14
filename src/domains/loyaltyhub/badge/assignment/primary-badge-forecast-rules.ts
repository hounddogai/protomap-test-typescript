import { PrimaryBadgeForecast } from "./primary-badge-forecast.js";

/** A rule a primary badge forecast must pass. Check returns its problems, or none. */
export interface PrimaryBadgeForecastRule {
  check(item: PrimaryBadgeForecast): string[];
}

export class PrimaryBadgeForecastScoreRangeRule implements PrimaryBadgeForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryBadgeForecast): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryBadgeForecastTagsLimitRule implements PrimaryBadgeForecastRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: PrimaryBadgeForecast): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class PrimaryBadgeForecastLocaleLengthRule implements PrimaryBadgeForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryBadgeForecast): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryBadgeForecastTitleLengthRule implements PrimaryBadgeForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryBadgeForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary badge forecast. */
export class PrimaryBadgeForecastValidator {
  rules: PrimaryBadgeForecastRule[];

  constructor(rules: PrimaryBadgeForecastRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryBadgeForecast): string[] {
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

  requireValid(item: PrimaryBadgeForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryBadgeForecast[]): Map<string, string[]> {
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

export function defaultPrimaryBadgeForecastValidator(): PrimaryBadgeForecastValidator {
  return new PrimaryBadgeForecastValidator(
    [
      new PrimaryBadgeForecastScoreRangeRule(3.9, 4427.4),
      new PrimaryBadgeForecastTagsLimitRule(80, []),
      new PrimaryBadgeForecastLocaleLengthRule(64),
      new PrimaryBadgeForecastTitleLengthRule(80),
    ],
  );
}
