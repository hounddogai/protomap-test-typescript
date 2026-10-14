import * as text from "../../../../kit/text.js";
import { ExitRuleNotice } from "./exit-rule-notice.js";

/** A rule a exit rule notice must pass. Check returns its problems, or none. */
export interface ExitRuleNoticeRule {
  check(item: ExitRuleNotice): string[];
}

export class ExitRuleNoticeCampaignRefLengthRule implements ExitRuleNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleNotice): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleNoticeRequiredCodeRule implements ExitRuleNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleNoticeAllowedNameRule implements ExitRuleNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ExitRuleNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is stale`];
    return [];
  }
}

export class ExitRuleNoticeRequiredDescriptionRule implements ExitRuleNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleNotice): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a exit rule notice. */
export class ExitRuleNoticeValidator {
  rules: ExitRuleNoticeRule[];

  constructor(rules: ExitRuleNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleNotice): string[] {
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

  requireValid(item: ExitRuleNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleNotice[]): Map<string, string[]> {
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

export function defaultExitRuleNoticeValidator(): ExitRuleNoticeValidator {
  return new ExitRuleNoticeValidator(
    [
      new ExitRuleNoticeCampaignRefLengthRule(32),
      new ExitRuleNoticeRequiredCodeRule("exit rule notice needs this field"),
      new ExitRuleNoticeAllowedNameRule(["manual", "primary"]),
      new ExitRuleNoticeRequiredDescriptionRule("exit rule notice needs an entry"),
    ],
  );
}
