import * as text from "../../../../kit/text.js";
import { GlobalQueueAgreement } from "./global-queue-agreement.js";

/** A rule a global queue agreement must pass. Check returns its problems, or none. */
export interface GlobalQueueAgreementRule {
  check(item: GlobalQueueAgreement): string[];
}

export class GlobalQueueAgreementRequiredLabelRule implements GlobalQueueAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalQueueAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalQueueAgreementAllowedLocaleRule implements GlobalQueueAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalQueueAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is stale`];
    return [];
  }
}

export class GlobalQueueAgreementRequiredCodeRule implements GlobalQueueAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalQueueAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalQueueAgreementCodeLengthRule implements GlobalQueueAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalQueueAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalQueueAgreementLabelLengthRule implements GlobalQueueAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalQueueAgreement): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalQueueAgreementRequiredLocaleRule implements GlobalQueueAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalQueueAgreement): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global queue agreement. */
export class GlobalQueueAgreementValidator {
  rules: GlobalQueueAgreementRule[];

  constructor(rules: GlobalQueueAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalQueueAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalQueueAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalQueueAgreement[]): Map<string, string[]> {
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

export function defaultGlobalQueueAgreementValidator(): GlobalQueueAgreementValidator {
  return new GlobalQueueAgreementValidator(
    [
      new GlobalQueueAgreementRequiredLabelRule("global queue agreement needs an entry"),
      new GlobalQueueAgreementAllowedLocaleRule(["primary", "primary", "fallback"]),
      new GlobalQueueAgreementRequiredCodeRule("global queue agreement needs a value"),
      new GlobalQueueAgreementCodeLengthRule(86400),
      new GlobalQueueAgreementLabelLengthRule(32),
      new GlobalQueueAgreementRequiredLocaleRule("global queue agreement needs a value"),
    ],
  );
}
