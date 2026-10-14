import { AdaptiveLevelNotice } from "./adaptive-level-notice.js";

/** A rule a adaptive level notice must pass. Check returns its problems, or none. */
export interface AdaptiveLevelNoticeRule {
  check(item: AdaptiveLevelNotice): string[];
}

export class AdaptiveLevelNoticeCostRangeRule implements AdaptiveLevelNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveLevelNotice): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveLevelNoticeFloorValueRangeRule implements AdaptiveLevelNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveLevelNotice): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveLevelNoticeCodeLengthRule implements AdaptiveLevelNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveLevelNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveLevelNoticeSequenceRangeRule implements AdaptiveLevelNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveLevelNotice): string[] {
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

export class AdaptiveLevelNoticeRequiredJourneyIdRule implements AdaptiveLevelNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveLevelNotice): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveLevelNoticeLabelLengthRule implements AdaptiveLevelNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveLevelNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive level notice. */
export class AdaptiveLevelNoticeValidator {
  rules: AdaptiveLevelNoticeRule[];

  constructor(rules: AdaptiveLevelNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveLevelNotice): string[] {
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

  requireValid(item: AdaptiveLevelNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveLevelNotice[]): Map<string, string[]> {
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

export function defaultAdaptiveLevelNoticeValidator(): AdaptiveLevelNoticeValidator {
  return new AdaptiveLevelNoticeValidator(
    [
      new AdaptiveLevelNoticeCostRangeRule(2.3, 2387.1),
      new AdaptiveLevelNoticeFloorValueRangeRule(9.9, 3874.7),
      new AdaptiveLevelNoticeCodeLengthRule(32),
      new AdaptiveLevelNoticeSequenceRangeRule(32, 64),
      new AdaptiveLevelNoticeRequiredJourneyIdRule("adaptive level notice needs a value"),
      new AdaptiveLevelNoticeLabelLengthRule(255),
    ],
  );
}
