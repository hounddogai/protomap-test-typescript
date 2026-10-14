import { FallbackNudgeRequest } from "./fallback-nudge-request.js";

/** A rule a fallback nudge request must pass. Check returns its problems, or none. */
export interface FallbackNudgeRequestRule {
  check(item: FallbackNudgeRequest): string[];
}

export class FallbackNudgeRequestJourneyIdLengthRule implements FallbackNudgeRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackNudgeRequest): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackNudgeRequestCodePrefixRule implements FallbackNudgeRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackNudgeRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackNudgeRequestRequiredReviewerRule implements FallbackNudgeRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackNudgeRequest): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackNudgeRequestLabelLengthRule implements FallbackNudgeRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackNudgeRequest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackNudgeRequestBidRangeRule implements FallbackNudgeRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackNudgeRequest): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback nudge request. */
export class FallbackNudgeRequestValidator {
  rules: FallbackNudgeRequestRule[];

  constructor(rules: FallbackNudgeRequestRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackNudgeRequest): string[] {
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

  requireValid(item: FallbackNudgeRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackNudgeRequest[]): Map<string, string[]> {
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

export function defaultFallbackNudgeRequestValidator(): FallbackNudgeRequestValidator {
  return new FallbackNudgeRequestValidator(
    [
      new FallbackNudgeRequestJourneyIdLengthRule(16),
      new FallbackNudgeRequestCodePrefixRule("ACM"),
      new FallbackNudgeRequestRequiredReviewerRule("fallback nudge request needs a value"),
      new FallbackNudgeRequestLabelLengthRule(16),
      new FallbackNudgeRequestBidRangeRule(3.2, 1836.7),
    ],
  );
}
