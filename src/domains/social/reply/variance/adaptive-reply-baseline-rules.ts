import { AdaptiveReplyBaseline } from "./adaptive-reply-baseline.js";

/** A rule a adaptive reply baseline must pass. Check returns its problems, or none. */
export interface AdaptiveReplyBaselineRule {
  check(item: AdaptiveReplyBaseline): string[];
}

export class AdaptiveReplyBaselineSegmentLengthRule implements AdaptiveReplyBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveReplyBaseline): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveReplyBaselineSourceLengthRule implements AdaptiveReplyBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveReplyBaseline): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveReplyBaselineTitleLengthRule implements AdaptiveReplyBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveReplyBaseline): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveReplyBaselineQuantityRangeRule implements AdaptiveReplyBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveReplyBaseline): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveReplyBaselineRequiredSourceRule implements AdaptiveReplyBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveReplyBaseline): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive reply baseline. */
export class AdaptiveReplyBaselineValidator {
  rules: AdaptiveReplyBaselineRule[];

  constructor(rules: AdaptiveReplyBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveReplyBaseline): string[] {
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

  requireValid(item: AdaptiveReplyBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveReplyBaseline[]): Map<string, string[]> {
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

export function defaultAdaptiveReplyBaselineValidator(): AdaptiveReplyBaselineValidator {
  return new AdaptiveReplyBaselineValidator(
    [
      new AdaptiveReplyBaselineSegmentLengthRule(16),
      new AdaptiveReplyBaselineSourceLengthRule(255),
      new AdaptiveReplyBaselineTitleLengthRule(3600),
      new AdaptiveReplyBaselineQuantityRangeRule(80, 3600),
      new AdaptiveReplyBaselineRequiredSourceRule("adaptive reply baseline needs an entry"),
    ],
  );
}
