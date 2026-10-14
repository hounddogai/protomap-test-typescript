import * as text from "../../../../kit/text.js";
import { PendingNudgeDigest } from "./pending-nudge-digest.js";

/** A rule a pending nudge digest must pass. Check returns its problems, or none. */
export interface PendingNudgeDigestRule {
  check(item: PendingNudgeDigest): string[];
}

export class PendingNudgeDigestRequiredNameRule implements PendingNudgeDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingNudgeDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingNudgeDigestCodeLengthRule implements PendingNudgeDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingNudgeDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingNudgeDigestAllowedCodeRule implements PendingNudgeDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingNudgeDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class PendingNudgeDigestRequiredCurrencyRule implements PendingNudgeDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingNudgeDigest): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending nudge digest. */
export class PendingNudgeDigestValidator {
  rules: PendingNudgeDigestRule[];

  constructor(rules: PendingNudgeDigestRule[]) {
    this.rules = rules;
  }

  validate(item: PendingNudgeDigest): string[] {
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

  requireValid(item: PendingNudgeDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingNudgeDigest[]): Map<string, string[]> {
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

export function defaultPendingNudgeDigestValidator(): PendingNudgeDigestValidator {
  return new PendingNudgeDigestValidator(
    [
      new PendingNudgeDigestRequiredNameRule("pending nudge digest needs this field"),
      new PendingNudgeDigestCodeLengthRule(1000),
      new PendingNudgeDigestAllowedCodeRule(["fallback", "batched"]),
      new PendingNudgeDigestRequiredCurrencyRule("pending nudge digest needs this field"),
    ],
  );
}
