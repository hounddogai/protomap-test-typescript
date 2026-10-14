import * as text from "../../../../kit/text.js";
import { RollingComplaintNotice } from "./rolling-complaint-notice.js";

/** A rule a rolling complaint notice must pass. Check returns its problems, or none. */
export interface RollingComplaintNoticeRule {
  check(item: RollingComplaintNotice): string[];
}

export class RollingComplaintNoticeRequiredTitleRule implements RollingComplaintNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingComplaintNotice): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingComplaintNoticeCodePrefixRule implements RollingComplaintNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingComplaintNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingComplaintNoticeAllowedChannelRule implements RollingComplaintNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingComplaintNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a rolling complaint notice. */
export class RollingComplaintNoticeValidator {
  rules: RollingComplaintNoticeRule[];

  constructor(rules: RollingComplaintNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: RollingComplaintNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingComplaintNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingComplaintNotice[]): Map<string, string[]> {
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

export function defaultRollingComplaintNoticeValidator(): RollingComplaintNoticeValidator {
  return new RollingComplaintNoticeValidator(
    [
      new RollingComplaintNoticeRequiredTitleRule("rolling complaint notice needs this field"),
      new RollingComplaintNoticeCodePrefixRule("X"),
      new RollingComplaintNoticeAllowedChannelRule(["primary", "seasonal", "seasonal"]),
    ],
  );
}
