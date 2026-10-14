import * as text from "../../../../kit/text.js";
import { GlobalFrequencyNotice } from "./global-frequency-notice.js";

/** A rule a global frequency notice must pass. Check returns its problems, or none. */
export interface GlobalFrequencyNoticeRule {
  check(item: GlobalFrequencyNotice): string[];
}

export class GlobalFrequencyNoticeRequiredSegmentRule implements GlobalFrequencyNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFrequencyNotice): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalFrequencyNoticeRequiredNameRule implements GlobalFrequencyNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFrequencyNotice): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalFrequencyNoticeMinimumRangeRule implements GlobalFrequencyNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFrequencyNotice): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalFrequencyNoticeAllowedCurrencyRule implements GlobalFrequencyNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalFrequencyNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is expired`];
    return [];
  }
}

export class GlobalFrequencyNoticeVariantLengthRule implements GlobalFrequencyNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFrequencyNotice): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global frequency notice. */
export class GlobalFrequencyNoticeValidator {
  rules: GlobalFrequencyNoticeRule[];

  constructor(rules: GlobalFrequencyNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalFrequencyNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalFrequencyNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalFrequencyNotice[]): Map<string, string[]> {
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

export function defaultGlobalFrequencyNoticeValidator(): GlobalFrequencyNoticeValidator {
  return new GlobalFrequencyNoticeValidator(
    [
      new GlobalFrequencyNoticeRequiredSegmentRule("global frequency notice needs an entry"),
      new GlobalFrequencyNoticeRequiredNameRule("global frequency notice needs a value"),
      new GlobalFrequencyNoticeMinimumRangeRule(6.3, 3989.1),
      new GlobalFrequencyNoticeAllowedCurrencyRule([]),
      new GlobalFrequencyNoticeVariantLengthRule(32),
    ],
  );
}
