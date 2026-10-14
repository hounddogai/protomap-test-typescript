import * as text from "../../../../kit/text.js";
import { PrimaryApprovalAgreement } from "./primary-approval-agreement.js";

/** A rule a primary approval agreement must pass. Check returns its problems, or none. */
export interface PrimaryApprovalAgreementRule {
  check(item: PrimaryApprovalAgreement): string[];
}

export class PrimaryApprovalAgreementRequiredLocaleRule implements PrimaryApprovalAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryApprovalAgreement): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryApprovalAgreementRequiredNameRule implements PrimaryApprovalAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryApprovalAgreement): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryApprovalAgreementAllowedCurrencyRule implements PrimaryApprovalAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryApprovalAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is not allowed`];
    return [];
  }
}

export class PrimaryApprovalAgreementCodeLengthRule implements PrimaryApprovalAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryApprovalAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryApprovalAgreementRequiredChannelRule implements PrimaryApprovalAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryApprovalAgreement): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryApprovalAgreementVisibleGuardRule implements PrimaryApprovalAgreementRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryApprovalAgreement): string[] {
    if (item.visible && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a primary approval agreement. */
export class PrimaryApprovalAgreementValidator {
  rules: PrimaryApprovalAgreementRule[];

  constructor(rules: PrimaryApprovalAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryApprovalAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryApprovalAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryApprovalAgreement[]): Map<string, string[]> {
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

export function defaultPrimaryApprovalAgreementValidator(): PrimaryApprovalAgreementValidator {
  return new PrimaryApprovalAgreementValidator(
    [
      new PrimaryApprovalAgreementRequiredLocaleRule("primary approval agreement needs this field"),
      new PrimaryApprovalAgreementRequiredNameRule("primary approval agreement needs a value"),
      new PrimaryApprovalAgreementAllowedCurrencyRule(["manual", "pending"]),
      new PrimaryApprovalAgreementCodeLengthRule(80),
      new PrimaryApprovalAgreementRequiredChannelRule("primary approval agreement needs an entry"),
      new PrimaryApprovalAgreementVisibleGuardRule(120),
    ],
  );
}
