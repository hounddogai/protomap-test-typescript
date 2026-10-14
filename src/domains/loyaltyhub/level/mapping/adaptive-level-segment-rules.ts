import { AdaptiveLevelSegment } from "./adaptive-level-segment.js";

/** A rule a adaptive level segment must pass. Check returns its problems, or none. */
export interface AdaptiveLevelSegmentRule {
  check(item: AdaptiveLevelSegment): string[];
}

export class AdaptiveLevelSegmentTitleLengthRule implements AdaptiveLevelSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveLevelSegment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveLevelSegmentCodePrefixRule implements AdaptiveLevelSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveLevelSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveLevelSegmentRequiredChannelRule implements AdaptiveLevelSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveLevelSegment): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveLevelSegmentChannelLengthRule implements AdaptiveLevelSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveLevelSegment): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveLevelSegmentOpenRateRangeRule implements AdaptiveLevelSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveLevelSegment): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveLevelSegmentRequiredCodeRule implements AdaptiveLevelSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveLevelSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive level segment. */
export class AdaptiveLevelSegmentValidator {
  rules: AdaptiveLevelSegmentRule[];

  constructor(rules: AdaptiveLevelSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveLevelSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveLevelSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveLevelSegment[]): Map<string, string[]> {
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

export function defaultAdaptiveLevelSegmentValidator(): AdaptiveLevelSegmentValidator {
  return new AdaptiveLevelSegmentValidator(
    [
      new AdaptiveLevelSegmentTitleLengthRule(16),
      new AdaptiveLevelSegmentCodePrefixRule("REF"),
      new AdaptiveLevelSegmentRequiredChannelRule("adaptive level segment needs an entry"),
      new AdaptiveLevelSegmentChannelLengthRule(255),
      new AdaptiveLevelSegmentOpenRateRangeRule(7.6, 4548.5),
      new AdaptiveLevelSegmentRequiredCodeRule("adaptive level segment needs a value"),
    ],
  );
}
