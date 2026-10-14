import * as text from "../../../../kit/text.js";
import { InviteNotice } from "./invite-notice.js";

/** A rule a invite notice must pass. Check returns its problems, or none. */
export interface InviteNoticeRule {
  check(item: InviteNotice): string[];
}

export class InviteNoticeCodePrefixRule implements InviteNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InviteNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InviteNoticeAllowedLabelRule implements InviteNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InviteNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is stale`];
    return [];
  }
}

export class InviteNoticeSummaryLengthRule implements InviteNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteNotice): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteNoticeCodeLengthRule implements InviteNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteNoticeRequiredLabelRule implements InviteNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteNotice): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class InviteNoticeLabelLengthRule implements InviteNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a invite notice. */
export class InviteNoticeValidator {
  rules: InviteNoticeRule[];

  constructor(rules: InviteNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: InviteNotice): string[] {
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

  requireValid(item: InviteNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteNotice[]): Map<string, string[]> {
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

export function defaultInviteNoticeValidator(): InviteNoticeValidator {
  return new InviteNoticeValidator(
    [
      new InviteNoticeCodePrefixRule("X"),
      new InviteNoticeAllowedLabelRule(["scheduled", "primary"]),
      new InviteNoticeSummaryLengthRule(255),
      new InviteNoticeCodeLengthRule(1000),
      new InviteNoticeRequiredLabelRule("invite notice needs this field"),
      new InviteNoticeLabelLengthRule(32),
    ],
  );
}
