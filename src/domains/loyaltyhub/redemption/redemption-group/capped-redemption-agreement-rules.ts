import * as text from "../../../../kit/text.js";
import { CappedRedemptionAgreement } from "./capped-redemption-agreement.js";

/** A rule a capped redemption agreement must pass. Check returns its problems, or none. */
export interface CappedRedemptionAgreementRule {
  check(item: CappedRedemptionAgreement): string[];
}

export class CappedRedemptionAgreementRequiredLocaleRule implements CappedRedemptionAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedRedemptionAgreement): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class CappedRedemptionAgreementAllowedAudienceIdRule implements CappedRedemptionAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedRedemptionAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is stale`];
    return [];
  }
}

export class CappedRedemptionAgreementLimitRangeRule implements CappedRedemptionAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedRedemptionAgreement): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a capped redemption agreement. */
export class CappedRedemptionAgreementValidator {
  rules: CappedRedemptionAgreementRule[];

  constructor(rules: CappedRedemptionAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: CappedRedemptionAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedRedemptionAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedRedemptionAgreement[]): Map<string, string[]> {
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

export function defaultCappedRedemptionAgreementValidator(): CappedRedemptionAgreementValidator {
  return new CappedRedemptionAgreementValidator(
    [
      new CappedRedemptionAgreementRequiredLocaleRule("capped redemption agreement needs an entry"),
      new CappedRedemptionAgreementAllowedAudienceIdRule(["weighted", "legacy", "primary"]),
      new CappedRedemptionAgreementLimitRangeRule(80, 86400),
    ],
  );
}
