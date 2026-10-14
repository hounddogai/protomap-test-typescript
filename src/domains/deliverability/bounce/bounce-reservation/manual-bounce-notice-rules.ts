import { ManualBounceNotice } from "./manual-bounce-notice.js";

/** A rule a manual bounce notice must pass. Check returns its problems, or none. */
export interface ManualBounceNoticeRule {
  check(item: ManualBounceNotice): string[];
}

export class ManualBounceNoticeTitleLengthRule implements ManualBounceNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBounceNotice): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBounceNoticeRequiredTitleRule implements ManualBounceNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBounceNotice): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualBounceNoticeJourneyIdLengthRule implements ManualBounceNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBounceNotice): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBounceNoticeCountryLengthRule implements ManualBounceNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBounceNotice): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBounceNoticeCodeLengthRule implements ManualBounceNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBounceNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBounceNoticeRequiredJourneyIdRule implements ManualBounceNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBounceNotice): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual bounce notice. */
export class ManualBounceNoticeValidator {
  rules: ManualBounceNoticeRule[];

  constructor(rules: ManualBounceNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: ManualBounceNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualBounceNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualBounceNotice[]): Map<string, string[]> {
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

export function defaultManualBounceNoticeValidator(): ManualBounceNoticeValidator {
  return new ManualBounceNoticeValidator(
    [
      new ManualBounceNoticeTitleLengthRule(255),
      new ManualBounceNoticeRequiredTitleRule("manual bounce notice needs a value"),
      new ManualBounceNoticeJourneyIdLengthRule(32),
      new ManualBounceNoticeCountryLengthRule(16),
      new ManualBounceNoticeCodeLengthRule(64),
      new ManualBounceNoticeRequiredJourneyIdRule("manual bounce notice needs this field"),
    ],
  );
}
