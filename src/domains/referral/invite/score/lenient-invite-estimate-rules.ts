import { LenientInviteEstimate } from "./lenient-invite-estimate.js";

/** A rule a lenient invite estimate must pass. Check returns its problems, or none. */
export interface LenientInviteEstimateRule {
  check(item: LenientInviteEstimate): string[];
}

export class LenientInviteEstimateRequiredCodeRule implements LenientInviteEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientInviteEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientInviteEstimateTitleLengthRule implements LenientInviteEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientInviteEstimate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientInviteEstimateCodeLengthRule implements LenientInviteEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientInviteEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientInviteEstimateSummaryLengthRule implements LenientInviteEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientInviteEstimate): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientInviteEstimateJourneyIdLengthRule implements LenientInviteEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientInviteEstimate): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientInviteEstimateApprovedGuardRule implements LenientInviteEstimateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientInviteEstimate): string[] {
    if (item.approved && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a lenient invite estimate. */
export class LenientInviteEstimateValidator {
  rules: LenientInviteEstimateRule[];

  constructor(rules: LenientInviteEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: LenientInviteEstimate): string[] {
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

  requireValid(item: LenientInviteEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientInviteEstimate[]): Map<string, string[]> {
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

export function defaultLenientInviteEstimateValidator(): LenientInviteEstimateValidator {
  return new LenientInviteEstimateValidator(
    [
      new LenientInviteEstimateRequiredCodeRule("lenient invite estimate needs this field"),
      new LenientInviteEstimateTitleLengthRule(80),
      new LenientInviteEstimateCodeLengthRule(16),
      new LenientInviteEstimateSummaryLengthRule(80),
      new LenientInviteEstimateJourneyIdLengthRule(64),
      new LenientInviteEstimateApprovedGuardRule(7.2),
    ],
  );
}
