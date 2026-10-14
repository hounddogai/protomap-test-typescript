import * as text from "../../../../kit/text.js";
import { GlobalSuppressionAgreement } from "./global-suppression-agreement.js";

/** A rule a global suppression agreement must pass. Check returns its problems, or none. */
export interface GlobalSuppressionAgreementRule {
  check(item: GlobalSuppressionAgreement): string[];
}

export class GlobalSuppressionAgreementTitleLengthRule implements GlobalSuppressionAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSuppressionAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalSuppressionAgreementPinnedGuardRule implements GlobalSuppressionAgreementRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalSuppressionAgreement): string[] {
    if (item.pinned && item.clicks > this.limit) return [`clicks ${item.clicks} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class GlobalSuppressionAgreementRequiredTitleRule implements GlobalSuppressionAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalSuppressionAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalSuppressionAgreementAllowedCodeRule implements GlobalSuppressionAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalSuppressionAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class GlobalSuppressionAgreementCodePrefixRule implements GlobalSuppressionAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalSuppressionAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a global suppression agreement. */
export class GlobalSuppressionAgreementValidator {
  rules: GlobalSuppressionAgreementRule[];

  constructor(rules: GlobalSuppressionAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalSuppressionAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalSuppressionAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalSuppressionAgreement[]): Map<string, string[]> {
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

export function defaultGlobalSuppressionAgreementValidator(): GlobalSuppressionAgreementValidator {
  return new GlobalSuppressionAgreementValidator(
    [
      new GlobalSuppressionAgreementTitleLengthRule(255),
      new GlobalSuppressionAgreementPinnedGuardRule(3600),
      new GlobalSuppressionAgreementRequiredTitleRule("global suppression agreement needs an entry"),
      new GlobalSuppressionAgreementAllowedCodeRule(["tiered", "adaptive", "pending"]),
      new GlobalSuppressionAgreementCodePrefixRule("REF"),
    ],
  );
}
