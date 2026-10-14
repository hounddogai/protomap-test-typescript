import { ComplaintEntry } from "./complaint-entry.js";

/** A rule a complaint entry must pass. Check returns its problems, or none. */
export interface ComplaintEntryRule {
  check(item: ComplaintEntry): string[];
}

export class ComplaintEntryRequiredAudienceIdRule implements ComplaintEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintEntry): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintEntryCodeLengthRule implements ComplaintEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintEntryRequiredContactEmailRule implements ComplaintEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintEntry): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a complaint entry. */
export class ComplaintEntryValidator {
  rules: ComplaintEntryRule[];

  constructor(rules: ComplaintEntryRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintEntry): string[] {
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

  requireValid(item: ComplaintEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintEntry[]): Map<string, string[]> {
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

export function defaultComplaintEntryValidator(): ComplaintEntryValidator {
  return new ComplaintEntryValidator(
    [
      new ComplaintEntryRequiredAudienceIdRule("complaint entry needs this field"),
      new ComplaintEntryCodeLengthRule(16),
      new ComplaintEntryRequiredContactEmailRule("complaint entry needs an entry"),
    ],
  );
}
