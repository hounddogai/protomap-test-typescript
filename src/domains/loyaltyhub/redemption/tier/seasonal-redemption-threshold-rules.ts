import { SeasonalRedemptionThreshold } from "./seasonal-redemption-threshold.js";

/** A rule a seasonal redemption threshold must pass. Check returns its problems, or none. */
export interface SeasonalRedemptionThresholdRule {
  check(item: SeasonalRedemptionThreshold): string[];
}

export class SeasonalRedemptionThresholdCodePrefixRule implements SeasonalRedemptionThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalRedemptionThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalRedemptionThresholdCostRangeRule implements SeasonalRedemptionThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalRedemptionThreshold): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalRedemptionThresholdRequiredTimezoneRule implements SeasonalRedemptionThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalRedemptionThreshold): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalRedemptionThresholdFloorValueRangeRule implements SeasonalRedemptionThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalRedemptionThreshold): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalRedemptionThresholdRequiredUtmSourceRule implements SeasonalRedemptionThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalRedemptionThreshold): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalRedemptionThresholdTimezoneLengthRule implements SeasonalRedemptionThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalRedemptionThreshold): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal redemption threshold. */
export class SeasonalRedemptionThresholdValidator {
  rules: SeasonalRedemptionThresholdRule[];

  constructor(rules: SeasonalRedemptionThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalRedemptionThreshold): string[] {
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

  requireValid(item: SeasonalRedemptionThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalRedemptionThreshold[]): Map<string, string[]> {
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

export function defaultSeasonalRedemptionThresholdValidator(): SeasonalRedemptionThresholdValidator {
  return new SeasonalRedemptionThresholdValidator(
    [
      new SeasonalRedemptionThresholdCodePrefixRule("X"),
      new SeasonalRedemptionThresholdCostRangeRule(0.2, 4884.7),
      new SeasonalRedemptionThresholdRequiredTimezoneRule("seasonal redemption threshold needs a value"),
      new SeasonalRedemptionThresholdFloorValueRangeRule(9.7, 4603.2),
      new SeasonalRedemptionThresholdRequiredUtmSourceRule("seasonal redemption threshold needs an entry"),
      new SeasonalRedemptionThresholdTimezoneLengthRule(64),
    ],
  );
}
