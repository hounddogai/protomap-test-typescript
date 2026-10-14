import { PrimaryPayoutOverride } from "./primary-payout-override.js";

/** A rule a primary payout override must pass. Check returns its problems, or none. */
export interface PrimaryPayoutOverrideRule {
  check(item: PrimaryPayoutOverride): string[];
}

export class PrimaryPayoutOverrideCodeLengthRule implements PrimaryPayoutOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPayoutOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPayoutOverrideFloorValueRangeRule implements PrimaryPayoutOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPayoutOverride): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryPayoutOverrideRequiredLabelRule implements PrimaryPayoutOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPayoutOverride): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary payout override. */
export class PrimaryPayoutOverrideValidator {
  rules: PrimaryPayoutOverrideRule[];

  constructor(rules: PrimaryPayoutOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPayoutOverride): string[] {
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

  requireValid(item: PrimaryPayoutOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPayoutOverride[]): Map<string, string[]> {
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

export function defaultPrimaryPayoutOverrideValidator(): PrimaryPayoutOverrideValidator {
  return new PrimaryPayoutOverrideValidator(
    [
      new PrimaryPayoutOverrideCodeLengthRule(3600),
      new PrimaryPayoutOverrideFloorValueRangeRule(5.6, 4973.3),
      new PrimaryPayoutOverrideRequiredLabelRule("primary payout override needs this field"),
    ],
  );
}
