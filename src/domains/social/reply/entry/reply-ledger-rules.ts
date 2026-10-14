import { ReplyLedger } from "./reply-ledger.js";

/** A rule a reply ledger must pass. Check returns its problems, or none. */
export interface ReplyLedgerRule {
  check(item: ReplyLedger): string[];
}

export class ReplyLedgerCountryLengthRule implements ReplyLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyLedger): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyLedgerRequiredChannelRule implements ReplyLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyLedger): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyLedgerCodePrefixRule implements ReplyLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReplyLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReplyLedgerNameLengthRule implements ReplyLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyLedger): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reply ledger. */
export class ReplyLedgerValidator {
  rules: ReplyLedgerRule[];

  constructor(rules: ReplyLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyLedger[]): Map<string, string[]> {
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

export function defaultReplyLedgerValidator(): ReplyLedgerValidator {
  return new ReplyLedgerValidator(
    [
      new ReplyLedgerCountryLengthRule(64),
      new ReplyLedgerRequiredChannelRule("reply ledger needs an entry"),
      new ReplyLedgerCodePrefixRule("ACM"),
      new ReplyLedgerNameLengthRule(86400),
    ],
  );
}
