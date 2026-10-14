import * as text from "../../../../kit/text.js";
import { SlaAgreement } from "./sla-agreement.js";

/** A rule a sla agreement must pass. Check returns its problems, or none. */
export interface SlaAgreementRule {
  check(item: SlaAgreement): string[];
}

export class SlaAgreementRequiredPhoneRule implements SlaAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaAgreement): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class SlaAgreementAllowedLabelRule implements SlaAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is stale`];
    return [];
  }
}

export class SlaAgreementLabelLengthRule implements SlaAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaAgreement): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sla agreement. */
export class SlaAgreementValidator {
  rules: SlaAgreementRule[];

  constructor(rules: SlaAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: SlaAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaAgreement[]): Map<string, string[]> {
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

export function defaultSlaAgreementValidator(): SlaAgreementValidator {
  return new SlaAgreementValidator(
    [
      new SlaAgreementRequiredPhoneRule("sla agreement needs an entry"),
      new SlaAgreementAllowedLabelRule(["fallback"]),
      new SlaAgreementLabelLengthRule(32),
    ],
  );
}
