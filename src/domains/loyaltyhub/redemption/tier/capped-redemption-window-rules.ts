import { CappedRedemptionWindow } from "./capped-redemption-window.js";

/** A rule a capped redemption window must pass. Check returns its problems, or none. */
export interface CappedRedemptionWindowRule {
  check(item: CappedRedemptionWindow): string[];
}

export class CappedRedemptionWindowRequiredPhoneRule implements CappedRedemptionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedRedemptionWindow): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class CappedRedemptionWindowRequiredNameRule implements CappedRedemptionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedRedemptionWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedRedemptionWindowThresholdRangeRule implements CappedRedemptionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedRedemptionWindow): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a capped redemption window. */
export class CappedRedemptionWindowValidator {
  rules: CappedRedemptionWindowRule[];

  constructor(rules: CappedRedemptionWindowRule[]) {
    this.rules = rules;
  }

  validate(item: CappedRedemptionWindow): string[] {
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

  requireValid(item: CappedRedemptionWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedRedemptionWindow[]): Map<string, string[]> {
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

export function defaultCappedRedemptionWindowValidator(): CappedRedemptionWindowValidator {
  return new CappedRedemptionWindowValidator(
    [
      new CappedRedemptionWindowRequiredPhoneRule("capped redemption window needs an entry"),
      new CappedRedemptionWindowRequiredNameRule("capped redemption window needs an entry"),
      new CappedRedemptionWindowThresholdRangeRule(3.4, 4475),
    ],
  );
}
