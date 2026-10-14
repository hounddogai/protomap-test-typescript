import { LenientInviteException } from "./lenient-invite-exception.js";

/** A rule a lenient invite exception must pass. Check returns its problems, or none. */
export interface LenientInviteExceptionRule {
  check(item: LenientInviteException): string[];
}

export class LenientInviteExceptionRequiredLocaleRule implements LenientInviteExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientInviteException): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class LenientInviteExceptionRequiredLabelRule implements LenientInviteExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientInviteException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientInviteExceptionCodeLengthRule implements LenientInviteExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientInviteException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientInviteExceptionRequiredCodeRule implements LenientInviteExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientInviteException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientInviteExceptionLabelLengthRule implements LenientInviteExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientInviteException): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientInviteExceptionEndsAtRangeRule implements LenientInviteExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientInviteException): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient invite exception. */
export class LenientInviteExceptionValidator {
  rules: LenientInviteExceptionRule[];

  constructor(rules: LenientInviteExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: LenientInviteException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientInviteException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientInviteException[]): Map<string, string[]> {
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

export function defaultLenientInviteExceptionValidator(): LenientInviteExceptionValidator {
  return new LenientInviteExceptionValidator(
    [
      new LenientInviteExceptionRequiredLocaleRule("lenient invite exception needs a value"),
      new LenientInviteExceptionRequiredLabelRule("lenient invite exception needs this field"),
      new LenientInviteExceptionCodeLengthRule(255),
      new LenientInviteExceptionRequiredCodeRule("lenient invite exception needs this field"),
      new LenientInviteExceptionLabelLengthRule(120),
      new LenientInviteExceptionEndsAtRangeRule(32, 80),
    ],
  );
}
