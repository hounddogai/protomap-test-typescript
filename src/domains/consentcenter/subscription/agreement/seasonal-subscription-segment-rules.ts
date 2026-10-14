import { SeasonalSubscriptionSegment } from "./seasonal-subscription-segment.js";

/** A rule a seasonal subscription segment must pass. Check returns its problems, or none. */
export interface SeasonalSubscriptionSegmentRule {
  check(item: SeasonalSubscriptionSegment): string[];
}

export class SeasonalSubscriptionSegmentFloorValueRangeRule implements SeasonalSubscriptionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalSubscriptionSegment): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalSubscriptionSegmentRequiredCodeRule implements SeasonalSubscriptionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalSubscriptionSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalSubscriptionSegmentRequiredNameRule implements SeasonalSubscriptionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalSubscriptionSegment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalSubscriptionSegmentCodePrefixRule implements SeasonalSubscriptionSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalSubscriptionSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalSubscriptionSegmentRequiredDescriptionRule implements SeasonalSubscriptionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalSubscriptionSegment): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalSubscriptionSegmentRequiredAudienceIdRule implements SeasonalSubscriptionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalSubscriptionSegment): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal subscription segment. */
export class SeasonalSubscriptionSegmentValidator {
  rules: SeasonalSubscriptionSegmentRule[];

  constructor(rules: SeasonalSubscriptionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalSubscriptionSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalSubscriptionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalSubscriptionSegment[]): Map<string, string[]> {
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

export function defaultSeasonalSubscriptionSegmentValidator(): SeasonalSubscriptionSegmentValidator {
  return new SeasonalSubscriptionSegmentValidator(
    [
      new SeasonalSubscriptionSegmentFloorValueRangeRule(0.4, 2814.4),
      new SeasonalSubscriptionSegmentRequiredCodeRule("seasonal subscription segment needs a value"),
      new SeasonalSubscriptionSegmentRequiredNameRule("seasonal subscription segment needs an entry"),
      new SeasonalSubscriptionSegmentCodePrefixRule("ACM"),
      new SeasonalSubscriptionSegmentRequiredDescriptionRule("seasonal subscription segment needs this field"),
      new SeasonalSubscriptionSegmentRequiredAudienceIdRule("seasonal subscription segment needs a value"),
    ],
  );
}
