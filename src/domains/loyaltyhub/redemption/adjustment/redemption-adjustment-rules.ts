import * as text from "../../../../kit/text.js";
import { RedemptionAdjustment } from "./redemption-adjustment.js";

/** A rule a redemption adjustment must pass. Check returns its problems, or none. */
export interface RedemptionAdjustmentRule {
  check(item: RedemptionAdjustment): string[];
}

export class RedemptionAdjustmentCodePrefixRule implements RedemptionAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RedemptionAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RedemptionAdjustmentRequiredCodeRule implements RedemptionAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionAdjustmentNameLengthRule implements RedemptionAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionAdjustment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionAdjustmentRequiredOwnerIdRule implements RedemptionAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionAdjustment): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionAdjustmentLimitRangeRule implements RedemptionAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionAdjustment): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RedemptionAdjustmentAllowedOwnerIdRule implements RedemptionAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RedemptionAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is stale`];
    return [];
  }
}

/** Runs every rule of a redemption adjustment. */
export class RedemptionAdjustmentValidator {
  rules: RedemptionAdjustmentRule[];

  constructor(rules: RedemptionAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RedemptionAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionAdjustment[]): Map<string, string[]> {
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

export function defaultRedemptionAdjustmentValidator(): RedemptionAdjustmentValidator {
  return new RedemptionAdjustmentValidator(
    [
      new RedemptionAdjustmentCodePrefixRule("OPS"),
      new RedemptionAdjustmentRequiredCodeRule("redemption adjustment needs an entry"),
      new RedemptionAdjustmentNameLengthRule(80),
      new RedemptionAdjustmentRequiredOwnerIdRule("redemption adjustment needs an entry"),
      new RedemptionAdjustmentLimitRangeRule(120, 86400),
      new RedemptionAdjustmentAllowedOwnerIdRule(["batched", "seasonal", "adaptive"]),
    ],
  );
}
