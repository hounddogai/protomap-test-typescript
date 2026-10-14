import { BatchedFunnelAgreement } from "./batched-funnel-agreement.js";

/** A rule a batched funnel agreement must pass. Check returns its problems, or none. */
export interface BatchedFunnelAgreementRule {
  check(item: BatchedFunnelAgreement): string[];
}

export class BatchedFunnelAgreementRequiredTitleRule implements BatchedFunnelAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFunnelAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedFunnelAgreementContactEmailLengthRule implements BatchedFunnelAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedFunnelAgreement): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedFunnelAgreementCurrencyLengthRule implements BatchedFunnelAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedFunnelAgreement): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedFunnelAgreementRequiredCurrencyRule implements BatchedFunnelAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFunnelAgreement): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched funnel agreement. */
export class BatchedFunnelAgreementValidator {
  rules: BatchedFunnelAgreementRule[];

  constructor(rules: BatchedFunnelAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedFunnelAgreement): string[] {
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

  requireValid(item: BatchedFunnelAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedFunnelAgreement[]): Map<string, string[]> {
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

export function defaultBatchedFunnelAgreementValidator(): BatchedFunnelAgreementValidator {
  return new BatchedFunnelAgreementValidator(
    [
      new BatchedFunnelAgreementRequiredTitleRule("batched funnel agreement needs this field"),
      new BatchedFunnelAgreementContactEmailLengthRule(1000),
      new BatchedFunnelAgreementCurrencyLengthRule(3600),
      new BatchedFunnelAgreementRequiredCurrencyRule("batched funnel agreement needs a value"),
    ],
  );
}
