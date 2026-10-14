import { RollingRedemptionWindow } from "./rolling-redemption-window.js";

/** A rule a rolling redemption window must pass. Check returns its problems, or none. */
export interface RollingRedemptionWindowRule {
  check(item: RollingRedemptionWindow): string[];
}

export class RollingRedemptionWindowRequiredRegionRule implements RollingRedemptionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingRedemptionWindow): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class RollingRedemptionWindowCodePrefixRule implements RollingRedemptionWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingRedemptionWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingRedemptionWindowRegionLengthRule implements RollingRedemptionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingRedemptionWindow): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling redemption window. */
export class RollingRedemptionWindowValidator {
  rules: RollingRedemptionWindowRule[];

  constructor(rules: RollingRedemptionWindowRule[]) {
    this.rules = rules;
  }

  validate(item: RollingRedemptionWindow): string[] {
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

  requireValid(item: RollingRedemptionWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingRedemptionWindow[]): Map<string, string[]> {
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

export function defaultRollingRedemptionWindowValidator(): RollingRedemptionWindowValidator {
  return new RollingRedemptionWindowValidator(
    [
      new RollingRedemptionWindowRequiredRegionRule("rolling redemption window needs an entry"),
      new RollingRedemptionWindowCodePrefixRule("Q"),
      new RollingRedemptionWindowRegionLengthRule(255),
    ],
  );
}
