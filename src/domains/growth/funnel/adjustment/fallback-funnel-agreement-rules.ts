import { FallbackFunnelAgreement } from "./fallback-funnel-agreement.js";

/** A rule a fallback funnel agreement must pass. Check returns its problems, or none. */
export interface FallbackFunnelAgreementRule {
  check(item: FallbackFunnelAgreement): string[];
}

export class FallbackFunnelAgreementCodeLengthRule implements FallbackFunnelAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFunnelAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFunnelAgreementRequiredLabelRule implements FallbackFunnelAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFunnelAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackFunnelAgreementRequiredOwnerIdRule implements FallbackFunnelAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFunnelAgreement): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackFunnelAgreementLabelLengthRule implements FallbackFunnelAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFunnelAgreement): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFunnelAgreementMarginRangeRule implements FallbackFunnelAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackFunnelAgreement): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackFunnelAgreementOwnerIdLengthRule implements FallbackFunnelAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFunnelAgreement): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback funnel agreement. */
export class FallbackFunnelAgreementValidator {
  rules: FallbackFunnelAgreementRule[];

  constructor(rules: FallbackFunnelAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackFunnelAgreement): string[] {
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

  requireValid(item: FallbackFunnelAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackFunnelAgreement[]): Map<string, string[]> {
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

export function defaultFallbackFunnelAgreementValidator(): FallbackFunnelAgreementValidator {
  return new FallbackFunnelAgreementValidator(
    [
      new FallbackFunnelAgreementCodeLengthRule(86400),
      new FallbackFunnelAgreementRequiredLabelRule("fallback funnel agreement needs a value"),
      new FallbackFunnelAgreementRequiredOwnerIdRule("fallback funnel agreement needs an entry"),
      new FallbackFunnelAgreementLabelLengthRule(86400),
      new FallbackFunnelAgreementMarginRangeRule(3.8, 774.5),
      new FallbackFunnelAgreementOwnerIdLengthRule(64),
    ],
  );
}
