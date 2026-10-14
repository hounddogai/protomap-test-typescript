import { LenientPreferenceNotice } from "./lenient-preference-notice.js";

/** A rule a lenient preference notice must pass. Check returns its problems, or none. */
export interface LenientPreferenceNoticeRule {
  check(item: LenientPreferenceNotice): string[];
}

export class LenientPreferenceNoticeRequiredVariantRule implements LenientPreferenceNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPreferenceNotice): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPreferenceNoticeNameLengthRule implements LenientPreferenceNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPreferenceNotice): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPreferenceNoticeRequiredChannelRule implements LenientPreferenceNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPreferenceNotice): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient preference notice. */
export class LenientPreferenceNoticeValidator {
  rules: LenientPreferenceNoticeRule[];

  constructor(rules: LenientPreferenceNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPreferenceNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientPreferenceNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPreferenceNotice[]): Map<string, string[]> {
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

export function defaultLenientPreferenceNoticeValidator(): LenientPreferenceNoticeValidator {
  return new LenientPreferenceNoticeValidator(
    [
      new LenientPreferenceNoticeRequiredVariantRule("lenient preference notice needs this field"),
      new LenientPreferenceNoticeNameLengthRule(16),
      new LenientPreferenceNoticeRequiredChannelRule("lenient preference notice needs a value"),
    ],
  );
}
