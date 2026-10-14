import { WeightedTouchpointNotice } from "./weighted-touchpoint-notice.js";

/** A rule a weighted touchpoint notice must pass. Check returns its problems, or none. */
export interface WeightedTouchpointNoticeRule {
  check(item: WeightedTouchpointNotice): string[];
}

export class WeightedTouchpointNoticeChannelLengthRule implements WeightedTouchpointNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedTouchpointNotice): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedTouchpointNoticeRequiredNameRule implements WeightedTouchpointNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedTouchpointNotice): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedTouchpointNoticeCodeLengthRule implements WeightedTouchpointNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedTouchpointNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedTouchpointNoticeRequiredCodeRule implements WeightedTouchpointNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedTouchpointNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedTouchpointNoticeNameLengthRule implements WeightedTouchpointNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedTouchpointNotice): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedTouchpointNoticeFloorValueRangeRule implements WeightedTouchpointNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedTouchpointNotice): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted touchpoint notice. */
export class WeightedTouchpointNoticeValidator {
  rules: WeightedTouchpointNoticeRule[];

  constructor(rules: WeightedTouchpointNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedTouchpointNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedTouchpointNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedTouchpointNotice[]): Map<string, string[]> {
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

export function defaultWeightedTouchpointNoticeValidator(): WeightedTouchpointNoticeValidator {
  return new WeightedTouchpointNoticeValidator(
    [
      new WeightedTouchpointNoticeChannelLengthRule(120),
      new WeightedTouchpointNoticeRequiredNameRule("weighted touchpoint notice needs an entry"),
      new WeightedTouchpointNoticeCodeLengthRule(16),
      new WeightedTouchpointNoticeRequiredCodeRule("weighted touchpoint notice needs an entry"),
      new WeightedTouchpointNoticeNameLengthRule(32),
      new WeightedTouchpointNoticeFloorValueRangeRule(8.2, 4804.6),
    ],
  );
}
