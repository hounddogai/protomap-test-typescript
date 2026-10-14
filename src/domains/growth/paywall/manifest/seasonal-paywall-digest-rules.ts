import * as text from "../../../../kit/text.js";
import { SeasonalPaywallDigest } from "./seasonal-paywall-digest.js";

/** A rule a seasonal paywall digest must pass. Check returns its problems, or none. */
export interface SeasonalPaywallDigestRule {
  check(item: SeasonalPaywallDigest): string[];
}

export class SeasonalPaywallDigestAllowedNameRule implements SeasonalPaywallDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalPaywallDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

export class SeasonalPaywallDigestCodeLengthRule implements SeasonalPaywallDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPaywallDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalPaywallDigestRequiredCodeRule implements SeasonalPaywallDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPaywallDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal paywall digest. */
export class SeasonalPaywallDigestValidator {
  rules: SeasonalPaywallDigestRule[];

  constructor(rules: SeasonalPaywallDigestRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalPaywallDigest): string[] {
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

  requireValid(item: SeasonalPaywallDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalPaywallDigest[]): Map<string, string[]> {
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

export function defaultSeasonalPaywallDigestValidator(): SeasonalPaywallDigestValidator {
  return new SeasonalPaywallDigestValidator(
    [
      new SeasonalPaywallDigestAllowedNameRule(["tiered", "legacy", "global"]),
      new SeasonalPaywallDigestCodeLengthRule(64),
      new SeasonalPaywallDigestRequiredCodeRule("seasonal paywall digest needs a value"),
    ],
  );
}
