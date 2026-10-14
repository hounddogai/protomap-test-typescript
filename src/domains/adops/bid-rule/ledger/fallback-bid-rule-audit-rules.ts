import { FallbackBidRuleAudit } from "./fallback-bid-rule-audit.js";

/** A rule a fallback bid rule audit must pass. Check returns its problems, or none. */
export interface FallbackBidRuleAuditRule {
  check(item: FallbackBidRuleAudit): string[];
}

export class FallbackBidRuleAuditRequiredCodeRule implements FallbackBidRuleAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBidRuleAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackBidRuleAuditRequiredCountryRule implements FallbackBidRuleAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBidRuleAudit): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackBidRuleAuditLabelLengthRule implements FallbackBidRuleAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBidRuleAudit): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBidRuleAuditCountryLengthRule implements FallbackBidRuleAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBidRuleAudit): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback bid rule audit. */
export class FallbackBidRuleAuditValidator {
  rules: FallbackBidRuleAuditRule[];

  constructor(rules: FallbackBidRuleAuditRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackBidRuleAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackBidRuleAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackBidRuleAudit[]): Map<string, string[]> {
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

export function defaultFallbackBidRuleAuditValidator(): FallbackBidRuleAuditValidator {
  return new FallbackBidRuleAuditValidator(
    [
      new FallbackBidRuleAuditRequiredCodeRule("fallback bid rule audit needs an entry"),
      new FallbackBidRuleAuditRequiredCountryRule("fallback bid rule audit needs an entry"),
      new FallbackBidRuleAuditLabelLengthRule(64),
      new FallbackBidRuleAuditCountryLengthRule(16),
    ],
  );
}
