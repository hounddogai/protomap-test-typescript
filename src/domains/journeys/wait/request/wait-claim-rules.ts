import * as text from "../../../../kit/text.js";
import { WaitClaim } from "./wait-claim.js";

/** A rule a wait claim must pass. Check returns its problems, or none. */
export interface WaitClaimRule {
  check(item: WaitClaim): string[];
}

export class WaitClaimAllowedCampaignRefRule implements WaitClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WaitClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is below minimum`];
    return [];
  }
}

export class WaitClaimCampaignRefLengthRule implements WaitClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitClaim): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitClaimCodePrefixRule implements WaitClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WaitClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WaitClaimLabelLengthRule implements WaitClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitClaimVersionRangeRule implements WaitClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitClaim): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WaitClaimChecksumLengthRule implements WaitClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitClaim): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a wait claim. */
export class WaitClaimValidator {
  rules: WaitClaimRule[];

  constructor(rules: WaitClaimRule[]) {
    this.rules = rules;
  }

  validate(item: WaitClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WaitClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitClaim[]): Map<string, string[]> {
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

export function defaultWaitClaimValidator(): WaitClaimValidator {
  return new WaitClaimValidator(
    [
      new WaitClaimAllowedCampaignRefRule([]),
      new WaitClaimCampaignRefLengthRule(64),
      new WaitClaimCodePrefixRule("REF"),
      new WaitClaimLabelLengthRule(255),
      new WaitClaimVersionRangeRule(120, 255),
      new WaitClaimChecksumLengthRule(120),
    ],
  );
}
