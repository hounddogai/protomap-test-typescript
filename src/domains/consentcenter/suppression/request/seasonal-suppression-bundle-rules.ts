import { SeasonalSuppressionBundle } from "./seasonal-suppression-bundle.js";

/** A rule a seasonal suppression bundle must pass. Check returns its problems, or none. */
export interface SeasonalSuppressionBundleRule {
  check(item: SeasonalSuppressionBundle): string[];
}

export class SeasonalSuppressionBundleCodePrefixRule implements SeasonalSuppressionBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalSuppressionBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalSuppressionBundleCodeLengthRule implements SeasonalSuppressionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalSuppressionBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalSuppressionBundleWeightRangeRule implements SeasonalSuppressionBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalSuppressionBundle): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalSuppressionBundlePinnedGuardRule implements SeasonalSuppressionBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalSuppressionBundle): string[] {
    if (item.pinned && item.cost > this.limit) return [`cost ${item.cost} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class SeasonalSuppressionBundleSegmentLengthRule implements SeasonalSuppressionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalSuppressionBundle): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalSuppressionBundleRequiredLabelRule implements SeasonalSuppressionBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalSuppressionBundle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal suppression bundle. */
export class SeasonalSuppressionBundleValidator {
  rules: SeasonalSuppressionBundleRule[];

  constructor(rules: SeasonalSuppressionBundleRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalSuppressionBundle): string[] {
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

  requireValid(item: SeasonalSuppressionBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalSuppressionBundle[]): Map<string, string[]> {
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

export function defaultSeasonalSuppressionBundleValidator(): SeasonalSuppressionBundleValidator {
  return new SeasonalSuppressionBundleValidator(
    [
      new SeasonalSuppressionBundleCodePrefixRule("Q"),
      new SeasonalSuppressionBundleCodeLengthRule(120),
      new SeasonalSuppressionBundleWeightRangeRule(0.1, 740),
      new SeasonalSuppressionBundlePinnedGuardRule(5.3),
      new SeasonalSuppressionBundleSegmentLengthRule(80),
      new SeasonalSuppressionBundleRequiredLabelRule("seasonal suppression bundle needs a value"),
    ],
  );
}
