import * as text from "../../../../kit/text.js";
import { ManualBounceVariance } from "./manual-bounce-variance.js";

/** A rule a manual bounce variance must pass. Check returns its problems, or none. */
export interface ManualBounceVarianceRule {
  check(item: ManualBounceVariance): string[];
}

export class ManualBounceVarianceLabelLengthRule implements ManualBounceVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBounceVariance): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBounceVarianceAllowedCodeRule implements ManualBounceVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualBounceVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class ManualBounceVarianceChecksumLengthRule implements ManualBounceVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBounceVariance): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBounceVarianceCampaignRefLengthRule implements ManualBounceVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBounceVariance): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBounceVarianceCodePrefixRule implements ManualBounceVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualBounceVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualBounceVarianceRequiredChecksumRule implements ManualBounceVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBounceVariance): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual bounce variance. */
export class ManualBounceVarianceValidator {
  rules: ManualBounceVarianceRule[];

  constructor(rules: ManualBounceVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: ManualBounceVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualBounceVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualBounceVariance[]): Map<string, string[]> {
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

export function defaultManualBounceVarianceValidator(): ManualBounceVarianceValidator {
  return new ManualBounceVarianceValidator(
    [
      new ManualBounceVarianceLabelLengthRule(1000),
      new ManualBounceVarianceAllowedCodeRule(["rolling", "fallback"]),
      new ManualBounceVarianceChecksumLengthRule(86400),
      new ManualBounceVarianceCampaignRefLengthRule(3600),
      new ManualBounceVarianceCodePrefixRule("ACM"),
      new ManualBounceVarianceRequiredChecksumRule("manual bounce variance needs a value"),
    ],
  );
}
