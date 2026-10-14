import { GlobalRedemptionSegment } from "./global-redemption-segment.js";

/** A rule a global redemption segment must pass. Check returns its problems, or none. */
export interface GlobalRedemptionSegmentRule {
  check(item: GlobalRedemptionSegment): string[];
}

export class GlobalRedemptionSegmentChannelLengthRule implements GlobalRedemptionSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRedemptionSegment): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRedemptionSegmentRequiredChannelRule implements GlobalRedemptionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRedemptionSegment): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRedemptionSegmentRequiredSourceRule implements GlobalRedemptionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRedemptionSegment): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRedemptionSegmentSourceLengthRule implements GlobalRedemptionSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRedemptionSegment): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global redemption segment. */
export class GlobalRedemptionSegmentValidator {
  rules: GlobalRedemptionSegmentRule[];

  constructor(rules: GlobalRedemptionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRedemptionSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalRedemptionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRedemptionSegment[]): Map<string, string[]> {
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

export function defaultGlobalRedemptionSegmentValidator(): GlobalRedemptionSegmentValidator {
  return new GlobalRedemptionSegmentValidator(
    [
      new GlobalRedemptionSegmentChannelLengthRule(64),
      new GlobalRedemptionSegmentRequiredChannelRule("global redemption segment needs this field"),
      new GlobalRedemptionSegmentRequiredSourceRule("global redemption segment needs a value"),
      new GlobalRedemptionSegmentSourceLengthRule(32),
    ],
  );
}
