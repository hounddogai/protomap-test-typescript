import { SeasonalWarmupThreshold } from "./seasonal-warmup-threshold.js";

/** A rule a seasonal warmup threshold must pass. Check returns its problems, or none. */
export interface SeasonalWarmupThresholdRule {
  check(item: SeasonalWarmupThreshold): string[];
}

export class SeasonalWarmupThresholdSequenceRangeRule implements SeasonalWarmupThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalWarmupThreshold): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalWarmupThresholdCodePrefixRule implements SeasonalWarmupThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalWarmupThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalWarmupThresholdJourneyIdLengthRule implements SeasonalWarmupThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalWarmupThreshold): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalWarmupThresholdRequiredJourneyIdRule implements SeasonalWarmupThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalWarmupThreshold): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalWarmupThresholdRequiredCodeRule implements SeasonalWarmupThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalWarmupThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalWarmupThresholdRequiredCampaignRefRule implements SeasonalWarmupThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalWarmupThreshold): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal warmup threshold. */
export class SeasonalWarmupThresholdValidator {
  rules: SeasonalWarmupThresholdRule[];

  constructor(rules: SeasonalWarmupThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalWarmupThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalWarmupThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalWarmupThreshold[]): Map<string, string[]> {
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

export function defaultSeasonalWarmupThresholdValidator(): SeasonalWarmupThresholdValidator {
  return new SeasonalWarmupThresholdValidator(
    [
      new SeasonalWarmupThresholdSequenceRangeRule(64, 86400),
      new SeasonalWarmupThresholdCodePrefixRule("REF"),
      new SeasonalWarmupThresholdJourneyIdLengthRule(3600),
      new SeasonalWarmupThresholdRequiredJourneyIdRule("seasonal warmup threshold needs an entry"),
      new SeasonalWarmupThresholdRequiredCodeRule("seasonal warmup threshold needs an entry"),
      new SeasonalWarmupThresholdRequiredCampaignRefRule("seasonal warmup threshold needs an entry"),
    ],
  );
}
