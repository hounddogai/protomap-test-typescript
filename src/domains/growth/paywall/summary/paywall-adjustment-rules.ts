import { PaywallAdjustment } from "./paywall-adjustment.js";

/** A rule a paywall adjustment must pass. Check returns its problems, or none. */
export interface PaywallAdjustmentRule {
  check(item: PaywallAdjustment): string[];
}

export class PaywallAdjustmentRequiredLabelRule implements PaywallAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallAdjustment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallAdjustmentCodePrefixRule implements PaywallAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PaywallAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PaywallAdjustmentCodeLengthRule implements PaywallAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a paywall adjustment. */
export class PaywallAdjustmentValidator {
  rules: PaywallAdjustmentRule[];

  constructor(rules: PaywallAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallAdjustment): string[] {
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

  requireValid(item: PaywallAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallAdjustment[]): Map<string, string[]> {
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

export function defaultPaywallAdjustmentValidator(): PaywallAdjustmentValidator {
  return new PaywallAdjustmentValidator(
    [
      new PaywallAdjustmentRequiredLabelRule("paywall adjustment needs this field"),
      new PaywallAdjustmentCodePrefixRule("OPS"),
      new PaywallAdjustmentCodeLengthRule(64),
    ],
  );
}
