import * as text from "../../../../kit/text.js";
import { PendingEscalationException } from "./pending-escalation-exception.js";

/** A rule a pending escalation exception must pass. Check returns its problems, or none. */
export interface PendingEscalationExceptionRule {
  check(item: PendingEscalationException): string[];
}

export class PendingEscalationExceptionRequiredLocaleRule implements PendingEscalationExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingEscalationException): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PendingEscalationExceptionCodePrefixRule implements PendingEscalationExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingEscalationException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingEscalationExceptionRequiredSegmentRule implements PendingEscalationExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingEscalationException): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class PendingEscalationExceptionRequiredCodeRule implements PendingEscalationExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingEscalationException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingEscalationExceptionAllowedCodeRule implements PendingEscalationExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingEscalationException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class PendingEscalationExceptionRequiredLabelRule implements PendingEscalationExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingEscalationException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending escalation exception. */
export class PendingEscalationExceptionValidator {
  rules: PendingEscalationExceptionRule[];

  constructor(rules: PendingEscalationExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: PendingEscalationException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingEscalationException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingEscalationException[]): Map<string, string[]> {
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

export function defaultPendingEscalationExceptionValidator(): PendingEscalationExceptionValidator {
  return new PendingEscalationExceptionValidator(
    [
      new PendingEscalationExceptionRequiredLocaleRule("pending escalation exception needs this field"),
      new PendingEscalationExceptionCodePrefixRule("OPS"),
      new PendingEscalationExceptionRequiredSegmentRule("pending escalation exception needs this field"),
      new PendingEscalationExceptionRequiredCodeRule("pending escalation exception needs a value"),
      new PendingEscalationExceptionAllowedCodeRule(["adaptive"]),
      new PendingEscalationExceptionRequiredLabelRule("pending escalation exception needs a value"),
    ],
  );
}
