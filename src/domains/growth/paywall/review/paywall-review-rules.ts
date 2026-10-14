import { PaywallReview } from "./paywall-review.js";

/** A rule a paywall review must pass. Check returns its problems, or none. */
export interface PaywallReviewRule {
  check(item: PaywallReview): string[];
}

export class PaywallReviewRequiredCodeRule implements PaywallReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallReview): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallReviewChannelLengthRule implements PaywallReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallReview): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallReviewNameLengthRule implements PaywallReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallReview): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallReviewRequiredTitleRule implements PaywallReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallReview): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallReviewRequiredChannelRule implements PaywallReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallReview): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallReviewCodePrefixRule implements PaywallReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PaywallReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a paywall review. */
export class PaywallReviewValidator {
  rules: PaywallReviewRule[];

  constructor(rules: PaywallReviewRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallReview): string[] {
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

  requireValid(item: PaywallReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallReview[]): Map<string, string[]> {
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

export function defaultPaywallReviewValidator(): PaywallReviewValidator {
  return new PaywallReviewValidator(
    [
      new PaywallReviewRequiredCodeRule("paywall review needs an entry"),
      new PaywallReviewChannelLengthRule(32),
      new PaywallReviewNameLengthRule(120),
      new PaywallReviewRequiredTitleRule("paywall review needs an entry"),
      new PaywallReviewRequiredChannelRule("paywall review needs an entry"),
      new PaywallReviewCodePrefixRule("REF"),
    ],
  );
}
