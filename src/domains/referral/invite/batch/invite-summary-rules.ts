import { InviteSummary } from "./invite-summary.js";

/** A rule a invite summary must pass. Check returns its problems, or none. */
export interface InviteSummaryRule {
  check(item: InviteSummary): string[];
}

export class InviteSummaryRequiredSummaryRule implements InviteSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteSummary): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class InviteSummaryExternalRefLengthRule implements InviteSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteSummary): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteSummaryRequiredLabelRule implements InviteSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class InviteSummaryCodeLengthRule implements InviteSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a invite summary. */
export class InviteSummaryValidator {
  rules: InviteSummaryRule[];

  constructor(rules: InviteSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: InviteSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteSummary[]): Map<string, string[]> {
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

export function defaultInviteSummaryValidator(): InviteSummaryValidator {
  return new InviteSummaryValidator(
    [
      new InviteSummaryRequiredSummaryRule("invite summary needs a value"),
      new InviteSummaryExternalRefLengthRule(32),
      new InviteSummaryRequiredLabelRule("invite summary needs this field"),
      new InviteSummaryCodeLengthRule(32),
    ],
  );
}
