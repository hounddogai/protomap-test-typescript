import { PrimarySubscriptionRequest } from "./primary-subscription-request.js";

/** A rule a primary subscription request must pass. Check returns its problems, or none. */
export interface PrimarySubscriptionRequestRule {
  check(item: PrimarySubscriptionRequest): string[];
}

export class PrimarySubscriptionRequestMaximumRangeRule implements PrimarySubscriptionRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimarySubscriptionRequest): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimarySubscriptionRequestRequiredChannelRule implements PrimarySubscriptionRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySubscriptionRequest): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PrimarySubscriptionRequestCodeLengthRule implements PrimarySubscriptionRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySubscriptionRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimarySubscriptionRequestReviewerLengthRule implements PrimarySubscriptionRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySubscriptionRequest): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary subscription request. */
export class PrimarySubscriptionRequestValidator {
  rules: PrimarySubscriptionRequestRule[];

  constructor(rules: PrimarySubscriptionRequestRule[]) {
    this.rules = rules;
  }

  validate(item: PrimarySubscriptionRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimarySubscriptionRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimarySubscriptionRequest[]): Map<string, string[]> {
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

export function defaultPrimarySubscriptionRequestValidator(): PrimarySubscriptionRequestValidator {
  return new PrimarySubscriptionRequestValidator(
    [
      new PrimarySubscriptionRequestMaximumRangeRule(5.4, 1189.7),
      new PrimarySubscriptionRequestRequiredChannelRule("primary subscription request needs a value"),
      new PrimarySubscriptionRequestCodeLengthRule(64),
      new PrimarySubscriptionRequestReviewerLengthRule(120),
    ],
  );
}
