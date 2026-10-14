import * as text from "../../../../kit/text.js";
import { PaywallCheckpoint } from "./paywall-checkpoint.js";

/** A rule a paywall checkpoint must pass. Check returns its problems, or none. */
export interface PaywallCheckpointRule {
  check(item: PaywallCheckpoint): string[];
}

export class PaywallCheckpointUnitLengthRule implements PaywallCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallCheckpoint): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallCheckpointTitleLengthRule implements PaywallCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallCheckpoint): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallCheckpointRequiredCurrencyRule implements PaywallCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallCheckpoint): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallCheckpointAllowedUnitRule implements PaywallCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PaywallCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is too long`];
    return [];
  }
}

/** Runs every rule of a paywall checkpoint. */
export class PaywallCheckpointValidator {
  rules: PaywallCheckpointRule[];

  constructor(rules: PaywallCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallCheckpoint): string[] {
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

  requireValid(item: PaywallCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallCheckpoint[]): Map<string, string[]> {
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

export function defaultPaywallCheckpointValidator(): PaywallCheckpointValidator {
  return new PaywallCheckpointValidator(
    [
      new PaywallCheckpointUnitLengthRule(1000),
      new PaywallCheckpointTitleLengthRule(86400),
      new PaywallCheckpointRequiredCurrencyRule("paywall checkpoint needs a value"),
      new PaywallCheckpointAllowedUnitRule([]),
    ],
  );
}
