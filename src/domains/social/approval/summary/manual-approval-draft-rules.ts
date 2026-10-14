import * as text from "../../../../kit/text.js";
import { ManualApprovalDraft } from "./manual-approval-draft.js";

/** A rule a manual approval draft must pass. Check returns its problems, or none. */
export interface ManualApprovalDraftRule {
  check(item: ManualApprovalDraft): string[];
}

export class ManualApprovalDraftCodePrefixRule implements ManualApprovalDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualApprovalDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualApprovalDraftRequiredCodeRule implements ManualApprovalDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualApprovalDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualApprovalDraftChannelLengthRule implements ManualApprovalDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualApprovalDraft): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualApprovalDraftAllowedLocaleRule implements ManualApprovalDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualApprovalDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is blocked`];
    return [];
  }
}

/** Runs every rule of a manual approval draft. */
export class ManualApprovalDraftValidator {
  rules: ManualApprovalDraftRule[];

  constructor(rules: ManualApprovalDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ManualApprovalDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualApprovalDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualApprovalDraft[]): Map<string, string[]> {
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

export function defaultManualApprovalDraftValidator(): ManualApprovalDraftValidator {
  return new ManualApprovalDraftValidator(
    [
      new ManualApprovalDraftCodePrefixRule("REF"),
      new ManualApprovalDraftRequiredCodeRule("manual approval draft needs an entry"),
      new ManualApprovalDraftChannelLengthRule(32),
      new ManualApprovalDraftAllowedLocaleRule(["primary"]),
    ],
  );
}
