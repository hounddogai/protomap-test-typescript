import { ReputationNotice } from "./reputation-notice.js";

/** A rule a reputation notice must pass. Check returns its problems, or none. */
export interface ReputationNoticeRule {
  check(item: ReputationNotice): string[];
}

export class ReputationNoticeCostRangeRule implements ReputationNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationNotice): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReputationNoticeRequiredCodeRule implements ReputationNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationNoticeCodeLengthRule implements ReputationNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationNoticeRequiredJourneyIdRule implements ReputationNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationNotice): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reputation notice. */
export class ReputationNoticeValidator {
  rules: ReputationNoticeRule[];

  constructor(rules: ReputationNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationNotice): string[] {
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

  requireValid(item: ReputationNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationNotice[]): Map<string, string[]> {
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

export function defaultReputationNoticeValidator(): ReputationNoticeValidator {
  return new ReputationNoticeValidator(
    [
      new ReputationNoticeCostRangeRule(3.2, 2844.4),
      new ReputationNoticeRequiredCodeRule("reputation notice needs a value"),
      new ReputationNoticeCodeLengthRule(16),
      new ReputationNoticeRequiredJourneyIdRule("reputation notice needs an entry"),
    ],
  );
}
