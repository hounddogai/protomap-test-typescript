import * as text from "../../../../kit/text.js";
import { RedemptionAgreement } from "./redemption-agreement.js";

/** A rule a redemption agreement must pass. Check returns its problems, or none. */
export interface RedemptionAgreementRule {
  check(item: RedemptionAgreement): string[];
}

export class RedemptionAgreementRequiredCodeRule implements RedemptionAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionAgreementCodePrefixRule implements RedemptionAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RedemptionAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RedemptionAgreementAllowedLabelRule implements RedemptionAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RedemptionAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is too long`];
    return [];
  }
}

export class RedemptionAgreementSourceLengthRule implements RedemptionAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionAgreement): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionAgreementCodeLengthRule implements RedemptionAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionAgreementRequiredLabelRule implements RedemptionAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a redemption agreement. */
export class RedemptionAgreementValidator {
  rules: RedemptionAgreementRule[];

  constructor(rules: RedemptionAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RedemptionAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionAgreement[]): Map<string, string[]> {
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

export function defaultRedemptionAgreementValidator(): RedemptionAgreementValidator {
  return new RedemptionAgreementValidator(
    [
      new RedemptionAgreementRequiredCodeRule("redemption agreement needs a value"),
      new RedemptionAgreementCodePrefixRule("ACM"),
      new RedemptionAgreementAllowedLabelRule(["batched"]),
      new RedemptionAgreementSourceLengthRule(120),
      new RedemptionAgreementCodeLengthRule(80),
      new RedemptionAgreementRequiredLabelRule("redemption agreement needs an entry"),
    ],
  );
}
