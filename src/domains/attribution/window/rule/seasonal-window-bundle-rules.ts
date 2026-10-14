import { SeasonalWindowBundle } from "./seasonal-window-bundle.js";

/** A rule a seasonal window bundle must pass. Check returns its problems, or none. */
export interface SeasonalWindowBundleRule {
  check(item: SeasonalWindowBundle): string[];
}

export class SeasonalWindowBundleAudienceIdLengthRule implements SeasonalWindowBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalWindowBundle): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalWindowBundleSourceLengthRule implements SeasonalWindowBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalWindowBundle): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalWindowBundleCodePrefixRule implements SeasonalWindowBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalWindowBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalWindowBundleVisibleGuardRule implements SeasonalWindowBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalWindowBundle): string[] {
    if (item.visible && item.batchSize > this.limit) return [`batch size ${item.batchSize} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a seasonal window bundle. */
export class SeasonalWindowBundleValidator {
  rules: SeasonalWindowBundleRule[];

  constructor(rules: SeasonalWindowBundleRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalWindowBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalWindowBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalWindowBundle[]): Map<string, string[]> {
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

export function defaultSeasonalWindowBundleValidator(): SeasonalWindowBundleValidator {
  return new SeasonalWindowBundleValidator(
    [
      new SeasonalWindowBundleAudienceIdLengthRule(32),
      new SeasonalWindowBundleSourceLengthRule(64),
      new SeasonalWindowBundleCodePrefixRule("REF"),
      new SeasonalWindowBundleVisibleGuardRule(86400),
    ],
  );
}
