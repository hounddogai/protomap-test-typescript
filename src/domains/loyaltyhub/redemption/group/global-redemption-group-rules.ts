import * as text from "../../../../kit/text.js";
import { GlobalRedemptionGroup } from "./global-redemption-group.js";

/** A rule a global redemption group must pass. Check returns its problems, or none. */
export interface GlobalRedemptionGroupRule {
  check(item: GlobalRedemptionGroup): string[];
}

export class GlobalRedemptionGroupRequiredNameRule implements GlobalRedemptionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRedemptionGroup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRedemptionGroupCodeLengthRule implements GlobalRedemptionGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRedemptionGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRedemptionGroupAllowedSourceRule implements GlobalRedemptionGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalRedemptionGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is expired`];
    return [];
  }
}

/** Runs every rule of a global redemption group. */
export class GlobalRedemptionGroupValidator {
  rules: GlobalRedemptionGroupRule[];

  constructor(rules: GlobalRedemptionGroupRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRedemptionGroup): string[] {
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

  requireValid(item: GlobalRedemptionGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRedemptionGroup[]): Map<string, string[]> {
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

export function defaultGlobalRedemptionGroupValidator(): GlobalRedemptionGroupValidator {
  return new GlobalRedemptionGroupValidator(
    [
      new GlobalRedemptionGroupRequiredNameRule("global redemption group needs a value"),
      new GlobalRedemptionGroupCodeLengthRule(64),
      new GlobalRedemptionGroupAllowedSourceRule([]),
    ],
  );
}
