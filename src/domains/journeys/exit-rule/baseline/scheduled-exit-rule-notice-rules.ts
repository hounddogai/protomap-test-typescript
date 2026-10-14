import * as text from "../../../../kit/text.js";
import { ScheduledExitRuleNotice } from "./scheduled-exit-rule-notice.js";

/** A rule a scheduled exit rule notice must pass. Check returns its problems, or none. */
export interface ScheduledExitRuleNoticeRule {
  check(item: ScheduledExitRuleNotice): string[];
}

export class ScheduledExitRuleNoticeCodeLengthRule implements ScheduledExitRuleNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledExitRuleNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledExitRuleNoticeAllowedAudienceIdRule implements ScheduledExitRuleNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledExitRuleNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is expired`];
    return [];
  }
}

export class ScheduledExitRuleNoticeCodePrefixRule implements ScheduledExitRuleNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledExitRuleNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledExitRuleNoticeRequiredNameRule implements ScheduledExitRuleNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledExitRuleNotice): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledExitRuleNoticeRequiredAudienceIdRule implements ScheduledExitRuleNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledExitRuleNotice): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled exit rule notice. */
export class ScheduledExitRuleNoticeValidator {
  rules: ScheduledExitRuleNoticeRule[];

  constructor(rules: ScheduledExitRuleNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledExitRuleNotice): string[] {
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

  requireValid(item: ScheduledExitRuleNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledExitRuleNotice[]): Map<string, string[]> {
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

export function defaultScheduledExitRuleNoticeValidator(): ScheduledExitRuleNoticeValidator {
  return new ScheduledExitRuleNoticeValidator(
    [
      new ScheduledExitRuleNoticeCodeLengthRule(16),
      new ScheduledExitRuleNoticeAllowedAudienceIdRule([]),
      new ScheduledExitRuleNoticeCodePrefixRule("OPS"),
      new ScheduledExitRuleNoticeRequiredNameRule("scheduled exit rule notice needs an entry"),
      new ScheduledExitRuleNoticeRequiredAudienceIdRule("scheduled exit rule notice needs an entry"),
    ],
  );
}
