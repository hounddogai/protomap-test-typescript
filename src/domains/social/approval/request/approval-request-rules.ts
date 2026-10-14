import * as text from "../../../../kit/text.js";
import { ApprovalRequest } from "./approval-request.js";

/** A rule a approval request must pass. Check returns its problems, or none. */
export interface ApprovalRequestRule {
  check(item: ApprovalRequest): string[];
}

export class ApprovalRequestRequiredNameRule implements ApprovalRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalRequestCodeLengthRule implements ApprovalRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalRequestCodePrefixRule implements ApprovalRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ApprovalRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ApprovalRequestAllowedVariantRule implements ApprovalRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ApprovalRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is above maximum`];
    return [];
  }
}

export class ApprovalRequestJourneyIdLengthRule implements ApprovalRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalRequest): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalRequestNameLengthRule implements ApprovalRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalRequest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a approval request. */
export class ApprovalRequestValidator {
  rules: ApprovalRequestRule[];

  constructor(rules: ApprovalRequestRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalRequest): string[] {
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

  requireValid(item: ApprovalRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalRequest[]): Map<string, string[]> {
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

export function defaultApprovalRequestValidator(): ApprovalRequestValidator {
  return new ApprovalRequestValidator(
    [
      new ApprovalRequestRequiredNameRule("approval request needs a value"),
      new ApprovalRequestCodeLengthRule(16),
      new ApprovalRequestCodePrefixRule("OPS"),
      new ApprovalRequestAllowedVariantRule(["legacy", "tiered"]),
      new ApprovalRequestJourneyIdLengthRule(64),
      new ApprovalRequestNameLengthRule(3600),
    ],
  );
}
