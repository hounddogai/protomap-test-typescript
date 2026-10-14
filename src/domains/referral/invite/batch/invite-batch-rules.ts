import { InviteBatch } from "./invite-batch.js";

/** A rule a invite batch must pass. Check returns its problems, or none. */
export interface InviteBatchRule {
  check(item: InviteBatch): string[];
}

export class InviteBatchCategoryLengthRule implements InviteBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteBatch): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteBatchRequiredCodeRule implements InviteBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InviteBatchJourneyIdLengthRule implements InviteBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteBatch): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a invite batch. */
export class InviteBatchValidator {
  rules: InviteBatchRule[];

  constructor(rules: InviteBatchRule[]) {
    this.rules = rules;
  }

  validate(item: InviteBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteBatch[]): Map<string, string[]> {
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

export function defaultInviteBatchValidator(): InviteBatchValidator {
  return new InviteBatchValidator(
    [
      new InviteBatchCategoryLengthRule(86400),
      new InviteBatchRequiredCodeRule("invite batch needs this field"),
      new InviteBatchJourneyIdLengthRule(1000),
    ],
  );
}
