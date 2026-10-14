import * as text from "../../../../kit/text.js";
import { PaywallNotice } from "./paywall-notice.js";

/** A rule a paywall notice must pass. Check returns its problems, or none. */
export interface PaywallNoticeRule {
  check(item: PaywallNotice): string[];
}

export class PaywallNoticeCodeLengthRule implements PaywallNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallNoticeRequiredCodeRule implements PaywallNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallNoticeRequiredLabelRule implements PaywallNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallNotice): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallNoticeAllowedCodeRule implements PaywallNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PaywallNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class PaywallNoticeRequiredNotesRule implements PaywallNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallNotice): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a paywall notice. */
export class PaywallNoticeValidator {
  rules: PaywallNoticeRule[];

  constructor(rules: PaywallNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallNotice[]): Map<string, string[]> {
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

export function defaultPaywallNoticeValidator(): PaywallNoticeValidator {
  return new PaywallNoticeValidator(
    [
      new PaywallNoticeCodeLengthRule(255),
      new PaywallNoticeRequiredCodeRule("paywall notice needs this field"),
      new PaywallNoticeRequiredLabelRule("paywall notice needs an entry"),
      new PaywallNoticeAllowedCodeRule(["fallback", "adaptive", "capped"]),
      new PaywallNoticeRequiredNotesRule("paywall notice needs this field"),
    ],
  );
}
