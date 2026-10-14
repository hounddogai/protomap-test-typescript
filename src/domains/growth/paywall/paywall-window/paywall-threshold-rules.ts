import { PaywallThreshold } from "./paywall-threshold.js";

/** A rule a paywall threshold must pass. Check returns its problems, or none. */
export interface PaywallThresholdRule {
  check(item: PaywallThreshold): string[];
}

export class PaywallThresholdRequiredLabelRule implements PaywallThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallThreshold): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallThresholdChannelLengthRule implements PaywallThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallThreshold): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallThresholdRequiredChannelRule implements PaywallThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallThreshold): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a paywall threshold. */
export class PaywallThresholdValidator {
  rules: PaywallThresholdRule[];

  constructor(rules: PaywallThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallThreshold): string[] {
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

  requireValid(item: PaywallThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallThreshold[]): Map<string, string[]> {
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

export function defaultPaywallThresholdValidator(): PaywallThresholdValidator {
  return new PaywallThresholdValidator(
    [
      new PaywallThresholdRequiredLabelRule("paywall threshold needs an entry"),
      new PaywallThresholdChannelLengthRule(16),
      new PaywallThresholdRequiredChannelRule("paywall threshold needs a value"),
    ],
  );
}
