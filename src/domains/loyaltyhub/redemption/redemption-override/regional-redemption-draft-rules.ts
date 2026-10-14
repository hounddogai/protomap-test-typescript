import { RegionalRedemptionDraft } from "./regional-redemption-draft.js";

/** A rule a regional redemption draft must pass. Check returns its problems, or none. */
export interface RegionalRedemptionDraftRule {
  check(item: RegionalRedemptionDraft): string[];
}

export class RegionalRedemptionDraftRequiredCodeRule implements RegionalRedemptionDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalRedemptionDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalRedemptionDraftReviewerLengthRule implements RegionalRedemptionDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalRedemptionDraft): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalRedemptionDraftRequiredReviewerRule implements RegionalRedemptionDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalRedemptionDraft): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional redemption draft. */
export class RegionalRedemptionDraftValidator {
  rules: RegionalRedemptionDraftRule[];

  constructor(rules: RegionalRedemptionDraftRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalRedemptionDraft): string[] {
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

  requireValid(item: RegionalRedemptionDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalRedemptionDraft[]): Map<string, string[]> {
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

export function defaultRegionalRedemptionDraftValidator(): RegionalRedemptionDraftValidator {
  return new RegionalRedemptionDraftValidator(
    [
      new RegionalRedemptionDraftRequiredCodeRule("regional redemption draft needs a value"),
      new RegionalRedemptionDraftReviewerLengthRule(1000),
      new RegionalRedemptionDraftRequiredReviewerRule("regional redemption draft needs a value"),
    ],
  );
}
