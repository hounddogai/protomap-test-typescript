import { FallbackStreakBundle } from "./fallback-streak-bundle.js";

/** A rule a fallback streak bundle must pass. Check returns its problems, or none. */
export interface FallbackStreakBundleRule {
  check(item: FallbackStreakBundle): string[];
}

export class FallbackStreakBundleRequiredContactEmailRule implements FallbackStreakBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackStreakBundle): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackStreakBundleWeightRangeRule implements FallbackStreakBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackStreakBundle): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackStreakBundleRequiredTitleRule implements FallbackStreakBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackStreakBundle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackStreakBundleCodeLengthRule implements FallbackStreakBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackStreakBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackStreakBundleAudienceIdLengthRule implements FallbackStreakBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackStreakBundle): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackStreakBundleRequiredAudienceIdRule implements FallbackStreakBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackStreakBundle): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback streak bundle. */
export class FallbackStreakBundleValidator {
  rules: FallbackStreakBundleRule[];

  constructor(rules: FallbackStreakBundleRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackStreakBundle): string[] {
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

  requireValid(item: FallbackStreakBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackStreakBundle[]): Map<string, string[]> {
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

export function defaultFallbackStreakBundleValidator(): FallbackStreakBundleValidator {
  return new FallbackStreakBundleValidator(
    [
      new FallbackStreakBundleRequiredContactEmailRule("fallback streak bundle needs a value"),
      new FallbackStreakBundleWeightRangeRule(3, 3075.5),
      new FallbackStreakBundleRequiredTitleRule("fallback streak bundle needs a value"),
      new FallbackStreakBundleCodeLengthRule(86400),
      new FallbackStreakBundleAudienceIdLengthRule(32),
      new FallbackStreakBundleRequiredAudienceIdRule("fallback streak bundle needs a value"),
    ],
  );
}
