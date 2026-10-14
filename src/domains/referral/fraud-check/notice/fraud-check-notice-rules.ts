import { FraudCheckNotice } from "./fraud-check-notice.js";

/** A rule a fraud check notice must pass. Check returns its problems, or none. */
export interface FraudCheckNoticeRule {
  check(item: FraudCheckNotice): string[];
}

export class FraudCheckNoticeChannelLengthRule implements FraudCheckNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckNotice): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckNoticeCodePrefixRule implements FraudCheckNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FraudCheckNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FraudCheckNoticeLabelLengthRule implements FraudCheckNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckNoticeCodeLengthRule implements FraudCheckNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fraud check notice. */
export class FraudCheckNoticeValidator {
  rules: FraudCheckNoticeRule[];

  constructor(rules: FraudCheckNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckNotice): string[] {
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

  requireValid(item: FraudCheckNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckNotice[]): Map<string, string[]> {
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

export function defaultFraudCheckNoticeValidator(): FraudCheckNoticeValidator {
  return new FraudCheckNoticeValidator(
    [
      new FraudCheckNoticeChannelLengthRule(120),
      new FraudCheckNoticeCodePrefixRule("Q"),
      new FraudCheckNoticeLabelLengthRule(1000),
      new FraudCheckNoticeCodeLengthRule(80),
    ],
  );
}
