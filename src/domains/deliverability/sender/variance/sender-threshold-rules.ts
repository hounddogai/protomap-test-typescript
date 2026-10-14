import * as text from "../../../../kit/text.js";
import { SenderThreshold } from "./sender-threshold.js";

/** A rule a sender threshold must pass. Check returns its problems, or none. */
export interface SenderThresholdRule {
  check(item: SenderThreshold): string[];
}

export class SenderThresholdCodeLengthRule implements SenderThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderThresholdWeightRangeRule implements SenderThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderThreshold): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SenderThresholdRatioRangeRule implements SenderThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderThreshold): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SenderThresholdAllowedTitleRule implements SenderThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SenderThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class SenderThresholdRequiredRegionRule implements SenderThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderThreshold): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class SenderThresholdClicksRangeRule implements SenderThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderThreshold): string[] {
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

/** Runs every rule of a sender threshold. */
export class SenderThresholdValidator {
  rules: SenderThresholdRule[];

  constructor(rules: SenderThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: SenderThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderThreshold[]): Map<string, string[]> {
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

export function defaultSenderThresholdValidator(): SenderThresholdValidator {
  return new SenderThresholdValidator(
    [
      new SenderThresholdCodeLengthRule(32),
      new SenderThresholdWeightRangeRule(2, 1964.2),
      new SenderThresholdRatioRangeRule(4.8, 1494.2),
      new SenderThresholdAllowedTitleRule(["batched"]),
      new SenderThresholdRequiredRegionRule("sender threshold needs an entry"),
      new SenderThresholdClicksRangeRule(120, 1000),
    ],
  );
}
