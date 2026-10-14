import * as text from "../../../../kit/text.js";
import { FunnelAdjustment } from "./funnel-adjustment.js";

/** A rule a funnel adjustment must pass. Check returns its problems, or none. */
export interface FunnelAdjustmentRule {
  check(item: FunnelAdjustment): string[];
}

export class FunnelAdjustmentCodeLengthRule implements FunnelAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelAdjustmentNameLengthRule implements FunnelAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelAdjustment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelAdjustmentAllowedNameRule implements FunnelAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FunnelAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

export class FunnelAdjustmentCodePrefixRule implements FunnelAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FunnelAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a funnel adjustment. */
export class FunnelAdjustmentValidator {
  rules: FunnelAdjustmentRule[];

  constructor(rules: FunnelAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelAdjustment[]): Map<string, string[]> {
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

export function defaultFunnelAdjustmentValidator(): FunnelAdjustmentValidator {
  return new FunnelAdjustmentValidator(
    [
      new FunnelAdjustmentCodeLengthRule(80),
      new FunnelAdjustmentNameLengthRule(16),
      new FunnelAdjustmentAllowedNameRule(["batched", "default", "fallback"]),
      new FunnelAdjustmentCodePrefixRule("X"),
    ],
  );
}
