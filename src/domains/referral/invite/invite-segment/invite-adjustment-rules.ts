import * as text from "../../../../kit/text.js";
import { InviteAdjustment } from "./invite-adjustment.js";

/** A rule a invite adjustment must pass. Check returns its problems, or none. */
export interface InviteAdjustmentRule {
  check(item: InviteAdjustment): string[];
}

export class InviteAdjustmentAllowedCodeRule implements InviteAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InviteAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class InviteAdjustmentSendAtRangeRule implements InviteAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteAdjustment): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InviteAdjustmentCampaignRefLengthRule implements InviteAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteAdjustment): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteAdjustmentCodePrefixRule implements InviteAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InviteAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InviteAdjustmentCodeLengthRule implements InviteAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a invite adjustment. */
export class InviteAdjustmentValidator {
  rules: InviteAdjustmentRule[];

  constructor(rules: InviteAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: InviteAdjustment): string[] {
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

  requireValid(item: InviteAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteAdjustment[]): Map<string, string[]> {
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

export function defaultInviteAdjustmentValidator(): InviteAdjustmentValidator {
  return new InviteAdjustmentValidator(
    [
      new InviteAdjustmentAllowedCodeRule(["regional", "capped"]),
      new InviteAdjustmentSendAtRangeRule(80, 3600),
      new InviteAdjustmentCampaignRefLengthRule(80),
      new InviteAdjustmentCodePrefixRule("OPS"),
      new InviteAdjustmentCodeLengthRule(3600),
    ],
  );
}
