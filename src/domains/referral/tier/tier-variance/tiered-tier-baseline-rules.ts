import * as text from "../../../../kit/text.js";
import { TieredTierBaseline } from "./tiered-tier-baseline.js";

/** A rule a tiered tier baseline must pass. Check returns its problems, or none. */
export interface TieredTierBaselineRule {
  check(item: TieredTierBaseline): string[];
}

export class TieredTierBaselineRequiredReviewerRule implements TieredTierBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTierBaseline): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTierBaselineAllowedCodeRule implements TieredTierBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredTierBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class TieredTierBaselineRequiredPhoneRule implements TieredTierBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTierBaseline): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered tier baseline. */
export class TieredTierBaselineValidator {
  rules: TieredTierBaselineRule[];

  constructor(rules: TieredTierBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: TieredTierBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredTierBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredTierBaseline[]): Map<string, string[]> {
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

export function defaultTieredTierBaselineValidator(): TieredTierBaselineValidator {
  return new TieredTierBaselineValidator(
    [
      new TieredTierBaselineRequiredReviewerRule("tiered tier baseline needs a value"),
      new TieredTierBaselineAllowedCodeRule(["rolling", "weighted"]),
      new TieredTierBaselineRequiredPhoneRule("tiered tier baseline needs an entry"),
    ],
  );
}
