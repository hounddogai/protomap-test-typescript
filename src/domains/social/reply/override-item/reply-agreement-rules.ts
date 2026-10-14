import { ReplyAgreement } from "./reply-agreement.js";

/** A rule a reply agreement must pass. Check returns its problems, or none. */
export interface ReplyAgreementRule {
  check(item: ReplyAgreement): string[];
}

export class ReplyAgreementApprovedGuardRule implements ReplyAgreementRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ReplyAgreement): string[] {
    if (item.approved && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class ReplyAgreementRequiredCodeRule implements ReplyAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyAgreementRequiredTimezoneRule implements ReplyAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyAgreement): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyAgreementCodeLengthRule implements ReplyAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reply agreement. */
export class ReplyAgreementValidator {
  rules: ReplyAgreementRule[];

  constructor(rules: ReplyAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyAgreement[]): Map<string, string[]> {
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

export function defaultReplyAgreementValidator(): ReplyAgreementValidator {
  return new ReplyAgreementValidator(
    [
      new ReplyAgreementApprovedGuardRule(86400),
      new ReplyAgreementRequiredCodeRule("reply agreement needs this field"),
      new ReplyAgreementRequiredTimezoneRule("reply agreement needs an entry"),
      new ReplyAgreementCodeLengthRule(255),
    ],
  );
}
