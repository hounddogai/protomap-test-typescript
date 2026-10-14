import * as text from "../../../../kit/text.js";
import { RedemptionNotice } from "./redemption-notice.js";

/** A rule a redemption notice must pass. Check returns its problems, or none. */
export interface RedemptionNoticeRule {
  check(item: RedemptionNotice): string[];
}

export class RedemptionNoticeAllowedNameRule implements RedemptionNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RedemptionNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class RedemptionNoticeRequiredCodeRule implements RedemptionNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionNoticePinnedGuardRule implements RedemptionNoticeRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RedemptionNotice): string[] {
    if (item.pinned && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a redemption notice. */
export class RedemptionNoticeValidator {
  rules: RedemptionNoticeRule[];

  constructor(rules: RedemptionNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionNotice): string[] {
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

  requireValid(item: RedemptionNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionNotice[]): Map<string, string[]> {
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

export function defaultRedemptionNoticeValidator(): RedemptionNoticeValidator {
  return new RedemptionNoticeValidator(
    [
      new RedemptionNoticeAllowedNameRule([]),
      new RedemptionNoticeRequiredCodeRule("redemption notice needs an entry"),
      new RedemptionNoticePinnedGuardRule(86400),
    ],
  );
}
