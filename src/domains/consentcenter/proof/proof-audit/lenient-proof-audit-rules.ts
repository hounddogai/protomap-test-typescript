import * as text from "../../../../kit/text.js";
import { LenientProofAudit } from "./lenient-proof-audit.js";

/** A rule a lenient proof audit must pass. Check returns its problems, or none. */
export interface LenientProofAuditRule {
  check(item: LenientProofAudit): string[];
}

export class LenientProofAuditWeightRangeRule implements LenientProofAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientProofAudit): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientProofAuditCampaignRefLengthRule implements LenientProofAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientProofAudit): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientProofAuditCodeLengthRule implements LenientProofAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientProofAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientProofAuditRequiredCodeRule implements LenientProofAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientProofAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientProofAuditAllowedCampaignRefRule implements LenientProofAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientProofAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is blocked`];
    return [];
  }
}

export class LenientProofAuditAmountRangeRule implements LenientProofAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientProofAudit): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a lenient proof audit. */
export class LenientProofAuditValidator {
  rules: LenientProofAuditRule[];

  constructor(rules: LenientProofAuditRule[]) {
    this.rules = rules;
  }

  validate(item: LenientProofAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientProofAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientProofAudit[]): Map<string, string[]> {
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

export function defaultLenientProofAuditValidator(): LenientProofAuditValidator {
  return new LenientProofAuditValidator(
    [
      new LenientProofAuditWeightRangeRule(3.5, 1946.7),
      new LenientProofAuditCampaignRefLengthRule(255),
      new LenientProofAuditCodeLengthRule(3600),
      new LenientProofAuditRequiredCodeRule("lenient proof audit needs a value"),
      new LenientProofAuditAllowedCampaignRefRule(["scheduled"]),
      new LenientProofAuditAmountRangeRule(1.3, 1327.8),
    ],
  );
}
