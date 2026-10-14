import * as text from "../../../../kit/text.js";
import { ActivationQuota } from "./activation-quota.js";

/** A rule a activation quota must pass. Check returns its problems, or none. */
export interface ActivationQuotaRule {
  check(item: ActivationQuota): string[];
}

export class ActivationQuotaAllowedOwnerIdRule implements ActivationQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ActivationQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is expired`];
    return [];
  }
}

export class ActivationQuotaRequiredOwnerIdRule implements ActivationQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationQuota): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationQuotaLabelLengthRule implements ActivationQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a activation quota. */
export class ActivationQuotaValidator {
  rules: ActivationQuotaRule[];

  constructor(rules: ActivationQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationQuota): string[] {
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

  requireValid(item: ActivationQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationQuota[]): Map<string, string[]> {
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

export function defaultActivationQuotaValidator(): ActivationQuotaValidator {
  return new ActivationQuotaValidator(
    [
      new ActivationQuotaAllowedOwnerIdRule([]),
      new ActivationQuotaRequiredOwnerIdRule("activation quota needs a value"),
      new ActivationQuotaLabelLengthRule(64),
    ],
  );
}
