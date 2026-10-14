import * as text from "../../../../kit/text.js";
import { RollingBidRuleProfile } from "./rolling-bid-rule-profile.js";

/** A rule a rolling bid rule profile must pass. Check returns its problems, or none. */
export interface RollingBidRuleProfileRule {
  check(item: RollingBidRuleProfile): string[];
}

export class RollingBidRuleProfileAllowedLabelRule implements RollingBidRuleProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingBidRuleProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is below minimum`];
    return [];
  }
}

export class RollingBidRuleProfileCodeLengthRule implements RollingBidRuleProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingBidRuleProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingBidRuleProfileRequiredTimezoneRule implements RollingBidRuleProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingBidRuleProfile): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling bid rule profile. */
export class RollingBidRuleProfileValidator {
  rules: RollingBidRuleProfileRule[];

  constructor(rules: RollingBidRuleProfileRule[]) {
    this.rules = rules;
  }

  validate(item: RollingBidRuleProfile): string[] {
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

  requireValid(item: RollingBidRuleProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingBidRuleProfile[]): Map<string, string[]> {
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

export function defaultRollingBidRuleProfileValidator(): RollingBidRuleProfileValidator {
  return new RollingBidRuleProfileValidator(
    [
      new RollingBidRuleProfileAllowedLabelRule(["tiered"]),
      new RollingBidRuleProfileCodeLengthRule(3600),
      new RollingBidRuleProfileRequiredTimezoneRule("rolling bid rule profile needs a value"),
    ],
  );
}
