import * as text from "../../../../kit/text.js";
import { RedemptionClaim } from "./redemption-claim.js";

/** A rule a redemption claim must pass. Check returns its problems, or none. */
export interface RedemptionClaimRule {
  check(item: RedemptionClaim): string[];
}

export class RedemptionClaimRequiredCodeRule implements RedemptionClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionClaimAllowedCodeRule implements RedemptionClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RedemptionClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class RedemptionClaimCodePrefixRule implements RedemptionClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RedemptionClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RedemptionClaimRequiredChannelRule implements RedemptionClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionClaim): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionClaimCodeLengthRule implements RedemptionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionClaimRequiredLabelRule implements RedemptionClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionClaim): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a redemption claim. */
export class RedemptionClaimValidator {
  rules: RedemptionClaimRule[];

  constructor(rules: RedemptionClaimRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RedemptionClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionClaim[]): Map<string, string[]> {
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

export function defaultRedemptionClaimValidator(): RedemptionClaimValidator {
  return new RedemptionClaimValidator(
    [
      new RedemptionClaimRequiredCodeRule("redemption claim needs a value"),
      new RedemptionClaimAllowedCodeRule([]),
      new RedemptionClaimCodePrefixRule("OPS"),
      new RedemptionClaimRequiredChannelRule("redemption claim needs an entry"),
      new RedemptionClaimCodeLengthRule(3600),
      new RedemptionClaimRequiredLabelRule("redemption claim needs an entry"),
    ],
  );
}
