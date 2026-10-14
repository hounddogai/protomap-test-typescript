import { RegionalFunnelReview } from "./regional-funnel-review.js";

/** A rule a regional funnel review must pass. Check returns its problems, or none. */
export interface RegionalFunnelReviewRule {
  check(item: RegionalFunnelReview): string[];
}

export class RegionalFunnelReviewRequiredTitleRule implements RegionalFunnelReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalFunnelReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalFunnelReviewCodeLengthRule implements RegionalFunnelReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalFunnelReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalFunnelReviewRequiredCodeRule implements RegionalFunnelReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalFunnelReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalFunnelReviewBidRangeRule implements RegionalFunnelReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalFunnelReview): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalFunnelReviewRequiredChannelRule implements RegionalFunnelReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalFunnelReview): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional funnel review. */
export class RegionalFunnelReviewValidator {
  rules: RegionalFunnelReviewRule[];

  constructor(rules: RegionalFunnelReviewRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalFunnelReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalFunnelReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalFunnelReview[]): Map<string, string[]> {
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

export function defaultRegionalFunnelReviewValidator(): RegionalFunnelReviewValidator {
  return new RegionalFunnelReviewValidator(
    [
      new RegionalFunnelReviewRequiredTitleRule("regional funnel review needs a value"),
      new RegionalFunnelReviewCodeLengthRule(3600),
      new RegionalFunnelReviewRequiredCodeRule("regional funnel review needs a value"),
      new RegionalFunnelReviewBidRangeRule(4.4, 879.1),
      new RegionalFunnelReviewRequiredChannelRule("regional funnel review needs an entry"),
    ],
  );
}
