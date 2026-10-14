import * as text from "../../../../kit/text.js";
import { EscalationNotice } from "./escalation-notice.js";

/** A rule a escalation notice must pass. Check returns its problems, or none. */
export interface EscalationNoticeRule {
  check(item: EscalationNotice): string[];
}

export class EscalationNoticeAllowedSummaryRule implements EscalationNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EscalationNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is inconsistent`];
    return [];
  }
}

export class EscalationNoticeRequiredUnitRule implements EscalationNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationNotice): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationNoticeRequiredSummaryRule implements EscalationNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationNotice): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationNoticeCodeLengthRule implements EscalationNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationNoticeSummaryLengthRule implements EscalationNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationNotice): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a escalation notice. */
export class EscalationNoticeValidator {
  rules: EscalationNoticeRule[];

  constructor(rules: EscalationNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationNotice): string[] {
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

  requireValid(item: EscalationNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationNotice[]): Map<string, string[]> {
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

export function defaultEscalationNoticeValidator(): EscalationNoticeValidator {
  return new EscalationNoticeValidator(
    [
      new EscalationNoticeAllowedSummaryRule(["regional", "fallback"]),
      new EscalationNoticeRequiredUnitRule("escalation notice needs this field"),
      new EscalationNoticeRequiredSummaryRule("escalation notice needs this field"),
      new EscalationNoticeCodeLengthRule(255),
      new EscalationNoticeSummaryLengthRule(3600),
    ],
  );
}
