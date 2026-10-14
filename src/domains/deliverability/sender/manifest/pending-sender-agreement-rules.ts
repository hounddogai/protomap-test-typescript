import { PendingSenderAgreement } from "./pending-sender-agreement.js";

/** A rule a pending sender agreement must pass. Check returns its problems, or none. */
export interface PendingSenderAgreementRule {
  check(item: PendingSenderAgreement): string[];
}

export class PendingSenderAgreementRequiredLabelRule implements PendingSenderAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSenderAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSenderAgreementActiveGuardRule implements PendingSenderAgreementRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingSenderAgreement): string[] {
    if (item.active && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while active`];
    return [];
  }
}

export class PendingSenderAgreementCodeLengthRule implements PendingSenderAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSenderAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingSenderAgreementRequiredCategoryRule implements PendingSenderAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSenderAgreement): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSenderAgreementJourneyIdLengthRule implements PendingSenderAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSenderAgreement): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending sender agreement. */
export class PendingSenderAgreementValidator {
  rules: PendingSenderAgreementRule[];

  constructor(rules: PendingSenderAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: PendingSenderAgreement): string[] {
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

  requireValid(item: PendingSenderAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingSenderAgreement[]): Map<string, string[]> {
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

export function defaultPendingSenderAgreementValidator(): PendingSenderAgreementValidator {
  return new PendingSenderAgreementValidator(
    [
      new PendingSenderAgreementRequiredLabelRule("pending sender agreement needs a value"),
      new PendingSenderAgreementActiveGuardRule(6.5),
      new PendingSenderAgreementCodeLengthRule(3600),
      new PendingSenderAgreementRequiredCategoryRule("pending sender agreement needs this field"),
      new PendingSenderAgreementJourneyIdLengthRule(86400),
    ],
  );
}
