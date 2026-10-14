import * as text from "../../../../kit/text.js";
import { WeightedFunnelAgreement } from "./weighted-funnel-agreement.js";

/** A rule a weighted funnel agreement must pass. Check returns its problems, or none. */
export interface WeightedFunnelAgreementRule {
  check(item: WeightedFunnelAgreement): string[];
}

export class WeightedFunnelAgreementAllowedCodeRule implements WeightedFunnelAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedFunnelAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class WeightedFunnelAgreementRequiredContactEmailRule implements WeightedFunnelAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedFunnelAgreement): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedFunnelAgreementCodeLengthRule implements WeightedFunnelAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedFunnelAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedFunnelAgreementContactEmailLengthRule implements WeightedFunnelAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedFunnelAgreement): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted funnel agreement. */
export class WeightedFunnelAgreementValidator {
  rules: WeightedFunnelAgreementRule[];

  constructor(rules: WeightedFunnelAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedFunnelAgreement): string[] {
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

  requireValid(item: WeightedFunnelAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedFunnelAgreement[]): Map<string, string[]> {
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

export function defaultWeightedFunnelAgreementValidator(): WeightedFunnelAgreementValidator {
  return new WeightedFunnelAgreementValidator(
    [
      new WeightedFunnelAgreementAllowedCodeRule(["adaptive", "adaptive", "tiered"]),
      new WeightedFunnelAgreementRequiredContactEmailRule("weighted funnel agreement needs an entry"),
      new WeightedFunnelAgreementCodeLengthRule(80),
      new WeightedFunnelAgreementContactEmailLengthRule(16),
    ],
  );
}
