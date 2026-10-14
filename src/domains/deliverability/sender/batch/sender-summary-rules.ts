import * as text from "../../../../kit/text.js";
import { SenderSummary } from "./sender-summary.js";

/** A rule a sender summary must pass. Check returns its problems, or none. */
export interface SenderSummaryRule {
  check(item: SenderSummary): string[];
}

export class SenderSummaryCodeLengthRule implements SenderSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderSummaryCodePrefixRule implements SenderSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SenderSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SenderSummaryAllowedNameRule implements SenderSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SenderSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class SenderSummaryRequiredCampaignRefRule implements SenderSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderSummary): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a sender summary. */
export class SenderSummaryValidator {
  rules: SenderSummaryRule[];

  constructor(rules: SenderSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: SenderSummary): string[] {
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

  requireValid(item: SenderSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderSummary[]): Map<string, string[]> {
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

export function defaultSenderSummaryValidator(): SenderSummaryValidator {
  return new SenderSummaryValidator(
    [
      new SenderSummaryCodeLengthRule(16),
      new SenderSummaryCodePrefixRule("Q"),
      new SenderSummaryAllowedNameRule(["strict", "capped"]),
      new SenderSummaryRequiredCampaignRefRule("sender summary needs an entry"),
    ],
  );
}
