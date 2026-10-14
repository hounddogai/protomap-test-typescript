import { TicketViewNotice } from "./ticket-view-notice.js";

/** A rule a ticket view notice must pass. Check returns its problems, or none. */
export interface TicketViewNoticeRule {
  check(item: TicketViewNotice): string[];
}

export class TicketViewNoticeCodePrefixRule implements TicketViewNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TicketViewNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TicketViewNoticeRequiredCodeRule implements TicketViewNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewNoticeCodeLengthRule implements TicketViewNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewNoticeAudienceIdLengthRule implements TicketViewNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewNotice): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a ticket view notice. */
export class TicketViewNoticeValidator {
  rules: TicketViewNoticeRule[];

  constructor(rules: TicketViewNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewNotice): string[] {
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

  requireValid(item: TicketViewNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewNotice[]): Map<string, string[]> {
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

export function defaultTicketViewNoticeValidator(): TicketViewNoticeValidator {
  return new TicketViewNoticeValidator(
    [
      new TicketViewNoticeCodePrefixRule("ACM"),
      new TicketViewNoticeRequiredCodeRule("ticket view notice needs an entry"),
      new TicketViewNoticeCodeLengthRule(16),
      new TicketViewNoticeAudienceIdLengthRule(120),
    ],
  );
}
