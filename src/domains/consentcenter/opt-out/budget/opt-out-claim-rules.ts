import * as text from "../../../../kit/text.js";
import { OptOutClaim } from "./opt-out-claim.js";

/** A rule a opt out claim must pass. Check returns its problems, or none. */
export interface OptOutClaimRule {
  check(item: OptOutClaim): string[];
}

export class OptOutClaimAmountRangeRule implements OptOutClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutClaim): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class OptOutClaimRequiredCategoryRule implements OptOutClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutClaim): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutClaimRequiredUtmSourceRule implements OptOutClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutClaim): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutClaimAllowedUtmSourceRule implements OptOutClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: OptOutClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is duplicated`];
    return [];
  }
}

export class OptOutClaimRequiredNameRule implements OptOutClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutClaim): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a opt out claim. */
export class OptOutClaimValidator {
  rules: OptOutClaimRule[];

  constructor(rules: OptOutClaimRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: OptOutClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutClaim[]): Map<string, string[]> {
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

export function defaultOptOutClaimValidator(): OptOutClaimValidator {
  return new OptOutClaimValidator(
    [
      new OptOutClaimAmountRangeRule(7.1, 1697.3),
      new OptOutClaimRequiredCategoryRule("opt out claim needs a value"),
      new OptOutClaimRequiredUtmSourceRule("opt out claim needs a value"),
      new OptOutClaimAllowedUtmSourceRule(["primary", "global"]),
      new OptOutClaimRequiredNameRule("opt out claim needs this field"),
    ],
  );
}
