import * as text from "../../../../kit/text.js";
import { CappedFraudCheckDraft } from "./capped-fraud-check-draft.js";

/** A rule a capped fraud check draft must pass. Check returns its problems, or none. */
export interface CappedFraudCheckDraftRule {
  check(item: CappedFraudCheckDraft): string[];
}

export class CappedFraudCheckDraftJourneyIdLengthRule implements CappedFraudCheckDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFraudCheckDraft): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedFraudCheckDraftRatioRangeRule implements CappedFraudCheckDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFraudCheckDraft): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedFraudCheckDraftAllowedTimezoneRule implements CappedFraudCheckDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedFraudCheckDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is missing`];
    return [];
  }
}

/** Runs every rule of a capped fraud check draft. */
export class CappedFraudCheckDraftValidator {
  rules: CappedFraudCheckDraftRule[];

  constructor(rules: CappedFraudCheckDraftRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFraudCheckDraft): string[] {
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

  requireValid(item: CappedFraudCheckDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFraudCheckDraft[]): Map<string, string[]> {
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

export function defaultCappedFraudCheckDraftValidator(): CappedFraudCheckDraftValidator {
  return new CappedFraudCheckDraftValidator(
    [
      new CappedFraudCheckDraftJourneyIdLengthRule(3600),
      new CappedFraudCheckDraftRatioRangeRule(3.9, 300.5),
      new CappedFraudCheckDraftAllowedTimezoneRule(["capped"]),
    ],
  );
}
