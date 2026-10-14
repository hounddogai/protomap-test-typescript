import { PreferenceNotice } from "./preference-notice.js";

/** A rule a preference notice must pass. Check returns its problems, or none. */
export interface PreferenceNoticeRule {
  check(item: PreferenceNotice): string[];
}

export class PreferenceNoticeCodePrefixRule implements PreferenceNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PreferenceNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PreferenceNoticeRequiredNameRule implements PreferenceNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceNotice): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceNoticeCurrencyLengthRule implements PreferenceNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceNotice): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceNoticeBudgetRangeRule implements PreferenceNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceNotice): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceNoticeCodeLengthRule implements PreferenceNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceNoticeChannelLengthRule implements PreferenceNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceNotice): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a preference notice. */
export class PreferenceNoticeValidator {
  rules: PreferenceNoticeRule[];

  constructor(rules: PreferenceNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceNotice): string[] {
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

  requireValid(item: PreferenceNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceNotice[]): Map<string, string[]> {
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

export function defaultPreferenceNoticeValidator(): PreferenceNoticeValidator {
  return new PreferenceNoticeValidator(
    [
      new PreferenceNoticeCodePrefixRule("Q"),
      new PreferenceNoticeRequiredNameRule("preference notice needs a value"),
      new PreferenceNoticeCurrencyLengthRule(32),
      new PreferenceNoticeBudgetRangeRule(6.3, 3858.4),
      new PreferenceNoticeCodeLengthRule(86400),
      new PreferenceNoticeChannelLengthRule(86400),
    ],
  );
}
