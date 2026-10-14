import * as text from "../../../../kit/text.js";
import { PaywallTarget } from "./paywall-target.js";

/** A rule a paywall target must pass. Check returns its problems, or none. */
export interface PaywallTargetRule {
  check(item: PaywallTarget): string[];
}

export class PaywallTargetCreatedAtRangeRule implements PaywallTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallTarget): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PaywallTargetArchivedGuardRule implements PaywallTargetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PaywallTarget): string[] {
    if (item.archived && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PaywallTargetAllowedLabelRule implements PaywallTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PaywallTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is expired`];
    return [];
  }
}

export class PaywallTargetCodeLengthRule implements PaywallTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallTargetWeightRangeRule implements PaywallTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallTarget): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a paywall target. */
export class PaywallTargetValidator {
  rules: PaywallTargetRule[];

  constructor(rules: PaywallTargetRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallTarget): string[] {
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

  requireValid(item: PaywallTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallTarget[]): Map<string, string[]> {
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

export function defaultPaywallTargetValidator(): PaywallTargetValidator {
  return new PaywallTargetValidator(
    [
      new PaywallTargetCreatedAtRangeRule(16, 120),
      new PaywallTargetArchivedGuardRule(255),
      new PaywallTargetAllowedLabelRule(["primary"]),
      new PaywallTargetCodeLengthRule(80),
      new PaywallTargetWeightRangeRule(2.4, 3422.2),
    ],
  );
}
