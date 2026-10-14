import * as text from "../../../../kit/text.js";
import { AdaptiveFunnelAgreement } from "./adaptive-funnel-agreement.js";

/** A rule a adaptive funnel agreement must pass. Check returns its problems, or none. */
export interface AdaptiveFunnelAgreementRule {
  check(item: AdaptiveFunnelAgreement): string[];
}

export class AdaptiveFunnelAgreementCodeLengthRule implements AdaptiveFunnelAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveFunnelAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveFunnelAgreementLocaleLengthRule implements AdaptiveFunnelAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveFunnelAgreement): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveFunnelAgreementAllowedLocaleRule implements AdaptiveFunnelAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveFunnelAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is duplicated`];
    return [];
  }
}

/** Runs every rule of a adaptive funnel agreement. */
export class AdaptiveFunnelAgreementValidator {
  rules: AdaptiveFunnelAgreementRule[];

  constructor(rules: AdaptiveFunnelAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveFunnelAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveFunnelAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveFunnelAgreement[]): Map<string, string[]> {
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

export function defaultAdaptiveFunnelAgreementValidator(): AdaptiveFunnelAgreementValidator {
  return new AdaptiveFunnelAgreementValidator(
    [
      new AdaptiveFunnelAgreementCodeLengthRule(86400),
      new AdaptiveFunnelAgreementLocaleLengthRule(3600),
      new AdaptiveFunnelAgreementAllowedLocaleRule([]),
    ],
  );
}
