import * as text from "../../../../kit/text.js";
import { ManualProofQuota } from "./manual-proof-quota.js";

/** A rule a manual proof quota must pass. Check returns its problems, or none. */
export interface ManualProofQuotaRule {
  check(item: ManualProofQuota): string[];
}

export class ManualProofQuotaLabelLengthRule implements ManualProofQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualProofQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualProofQuotaAllowedCodeRule implements ManualProofQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualProofQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class ManualProofQuotaRequiredChannelRule implements ManualProofQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualProofQuota): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class ManualProofQuotaRequiredCodeRule implements ManualProofQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualProofQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualProofQuotaCodeLengthRule implements ManualProofQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualProofQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual proof quota. */
export class ManualProofQuotaValidator {
  rules: ManualProofQuotaRule[];

  constructor(rules: ManualProofQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ManualProofQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualProofQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualProofQuota[]): Map<string, string[]> {
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

export function defaultManualProofQuotaValidator(): ManualProofQuotaValidator {
  return new ManualProofQuotaValidator(
    [
      new ManualProofQuotaLabelLengthRule(120),
      new ManualProofQuotaAllowedCodeRule(["batched", "default"]),
      new ManualProofQuotaRequiredChannelRule("manual proof quota needs a value"),
      new ManualProofQuotaRequiredCodeRule("manual proof quota needs this field"),
      new ManualProofQuotaCodeLengthRule(16),
    ],
  );
}
