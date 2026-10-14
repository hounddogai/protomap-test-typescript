import * as text from "../../../../kit/text.js";
import { ManualFunnelException } from "./manual-funnel-exception.js";

/** A rule a manual funnel exception must pass. Check returns its problems, or none. */
export interface ManualFunnelExceptionRule {
  check(item: ManualFunnelException): string[];
}

export class ManualFunnelExceptionAttemptsRangeRule implements ManualFunnelExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualFunnelException): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualFunnelExceptionRequiredLabelRule implements ManualFunnelExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFunnelException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ManualFunnelExceptionRequiredCampaignRefRule implements ManualFunnelExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFunnelException): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ManualFunnelExceptionCampaignRefLengthRule implements ManualFunnelExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualFunnelException): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualFunnelExceptionAllowedCodeRule implements ManualFunnelExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualFunnelException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class ManualFunnelExceptionCodeLengthRule implements ManualFunnelExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualFunnelException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual funnel exception. */
export class ManualFunnelExceptionValidator {
  rules: ManualFunnelExceptionRule[];

  constructor(rules: ManualFunnelExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: ManualFunnelException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualFunnelException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualFunnelException[]): Map<string, string[]> {
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

export function defaultManualFunnelExceptionValidator(): ManualFunnelExceptionValidator {
  return new ManualFunnelExceptionValidator(
    [
      new ManualFunnelExceptionAttemptsRangeRule(80, 255),
      new ManualFunnelExceptionRequiredLabelRule("manual funnel exception needs an entry"),
      new ManualFunnelExceptionRequiredCampaignRefRule("manual funnel exception needs this field"),
      new ManualFunnelExceptionCampaignRefLengthRule(64),
      new ManualFunnelExceptionAllowedCodeRule(["scheduled", "regional", "seasonal"]),
      new ManualFunnelExceptionCodeLengthRule(16),
    ],
  );
}
