import { NudgeAgreement } from "./nudge-agreement.js";

/** A rule a nudge agreement must pass. Check returns its problems, or none. */
export interface NudgeAgreementRule {
  check(item: NudgeAgreement): string[];
}

export class NudgeAgreementTitleLengthRule implements NudgeAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeAgreementAttemptsRangeRule implements NudgeAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeAgreement): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class NudgeAgreementApprovedGuardRule implements NudgeAgreementRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: NudgeAgreement): string[] {
    if (item.approved && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class NudgeAgreementRequiredReviewerRule implements NudgeAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeAgreement): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeAgreementAudienceIdLengthRule implements NudgeAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeAgreement): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a nudge agreement. */
export class NudgeAgreementValidator {
  rules: NudgeAgreementRule[];

  constructor(rules: NudgeAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeAgreement): string[] {
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

  requireValid(item: NudgeAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeAgreement[]): Map<string, string[]> {
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

export function defaultNudgeAgreementValidator(): NudgeAgreementValidator {
  return new NudgeAgreementValidator(
    [
      new NudgeAgreementTitleLengthRule(86400),
      new NudgeAgreementAttemptsRangeRule(120, 255),
      new NudgeAgreementApprovedGuardRule(32),
      new NudgeAgreementRequiredReviewerRule("nudge agreement needs an entry"),
      new NudgeAgreementAudienceIdLengthRule(32),
    ],
  );
}
