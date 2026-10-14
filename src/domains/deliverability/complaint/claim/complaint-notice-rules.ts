import * as text from "../../../../kit/text.js";
import { ComplaintNotice } from "./complaint-notice.js";

/** A rule a complaint notice must pass. Check returns its problems, or none. */
export interface ComplaintNoticeRule {
  check(item: ComplaintNotice): string[];
}

export class ComplaintNoticeRequiredOwnerIdRule implements ComplaintNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintNotice): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintNoticeExternalRefLengthRule implements ComplaintNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintNotice): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintNoticeAllowedChecksumRule implements ComplaintNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ComplaintNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is inconsistent`];
    return [];
  }
}

export class ComplaintNoticeCodeLengthRule implements ComplaintNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintNoticeRequiredCodeRule implements ComplaintNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a complaint notice. */
export class ComplaintNoticeValidator {
  rules: ComplaintNoticeRule[];

  constructor(rules: ComplaintNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintNotice): string[] {
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

  requireValid(item: ComplaintNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintNotice[]): Map<string, string[]> {
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

export function defaultComplaintNoticeValidator(): ComplaintNoticeValidator {
  return new ComplaintNoticeValidator(
    [
      new ComplaintNoticeRequiredOwnerIdRule("complaint notice needs this field"),
      new ComplaintNoticeExternalRefLengthRule(32),
      new ComplaintNoticeAllowedChecksumRule(["global", "adaptive"]),
      new ComplaintNoticeCodeLengthRule(32),
      new ComplaintNoticeRequiredCodeRule("complaint notice needs this field"),
    ],
  );
}
