import { SeasonalBadgeManifest } from "./seasonal-badge-manifest.js";

/** A rule a seasonal badge manifest must pass. Check returns its problems, or none. */
export interface SeasonalBadgeManifestRule {
  check(item: SeasonalBadgeManifest): string[];
}

export class SeasonalBadgeManifestThresholdRangeRule implements SeasonalBadgeManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalBadgeManifest): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalBadgeManifestLocaleLengthRule implements SeasonalBadgeManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBadgeManifest): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalBadgeManifestRequiredTitleRule implements SeasonalBadgeManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBadgeManifest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalBadgeManifestClicksRangeRule implements SeasonalBadgeManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalBadgeManifest): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a seasonal badge manifest. */
export class SeasonalBadgeManifestValidator {
  rules: SeasonalBadgeManifestRule[];

  constructor(rules: SeasonalBadgeManifestRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalBadgeManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalBadgeManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalBadgeManifest[]): Map<string, string[]> {
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

export function defaultSeasonalBadgeManifestValidator(): SeasonalBadgeManifestValidator {
  return new SeasonalBadgeManifestValidator(
    [
      new SeasonalBadgeManifestThresholdRangeRule(6.4, 435.6),
      new SeasonalBadgeManifestLocaleLengthRule(32),
      new SeasonalBadgeManifestRequiredTitleRule("seasonal badge manifest needs this field"),
      new SeasonalBadgeManifestClicksRangeRule(64, 1000),
    ],
  );
}
