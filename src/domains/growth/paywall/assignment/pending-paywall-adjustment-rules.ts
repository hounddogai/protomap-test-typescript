import { PendingPaywallAdjustment } from "./pending-paywall-adjustment.js";

/** A rule a pending paywall adjustment must pass. Check returns its problems, or none. */
export interface PendingPaywallAdjustmentRule {
  check(item: PendingPaywallAdjustment): string[];
}

export class PendingPaywallAdjustmentPhoneLengthRule implements PendingPaywallAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPaywallAdjustment): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPaywallAdjustmentNameLengthRule implements PendingPaywallAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPaywallAdjustment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPaywallAdjustmentCodeLengthRule implements PendingPaywallAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPaywallAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPaywallAdjustmentSegmentLengthRule implements PendingPaywallAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPaywallAdjustment): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPaywallAdjustmentRequiredPhoneRule implements PendingPaywallAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPaywallAdjustment): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending paywall adjustment. */
export class PendingPaywallAdjustmentValidator {
  rules: PendingPaywallAdjustmentRule[];

  constructor(rules: PendingPaywallAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: PendingPaywallAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingPaywallAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingPaywallAdjustment[]): Map<string, string[]> {
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

export function defaultPendingPaywallAdjustmentValidator(): PendingPaywallAdjustmentValidator {
  return new PendingPaywallAdjustmentValidator(
    [
      new PendingPaywallAdjustmentPhoneLengthRule(120),
      new PendingPaywallAdjustmentNameLengthRule(16),
      new PendingPaywallAdjustmentCodeLengthRule(64),
      new PendingPaywallAdjustmentSegmentLengthRule(3600),
      new PendingPaywallAdjustmentRequiredPhoneRule("pending paywall adjustment needs a value"),
    ],
  );
}
