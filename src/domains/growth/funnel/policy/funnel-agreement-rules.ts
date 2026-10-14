import { FunnelAgreement } from "./funnel-agreement.js";

/** A rule a funnel agreement must pass. Check returns its problems, or none. */
export interface FunnelAgreementRule {
  check(item: FunnelAgreement): string[];
}

export class FunnelAgreementRequiredChannelRule implements FunnelAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelAgreement): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelAgreementChannelLengthRule implements FunnelAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelAgreement): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelAgreementCodeLengthRule implements FunnelAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a funnel agreement. */
export class FunnelAgreementValidator {
  rules: FunnelAgreementRule[];

  constructor(rules: FunnelAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelAgreement): string[] {
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

  requireValid(item: FunnelAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelAgreement[]): Map<string, string[]> {
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

export function defaultFunnelAgreementValidator(): FunnelAgreementValidator {
  return new FunnelAgreementValidator(
    [
      new FunnelAgreementRequiredChannelRule("funnel agreement needs a value"),
      new FunnelAgreementChannelLengthRule(16),
      new FunnelAgreementCodeLengthRule(64),
    ],
  );
}
