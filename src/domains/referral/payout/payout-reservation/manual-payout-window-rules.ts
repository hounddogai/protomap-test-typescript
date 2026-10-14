import { ManualPayoutWindow } from "./manual-payout-window.js";

/** A rule a manual payout window must pass. Check returns its problems, or none. */
export interface ManualPayoutWindowRule {
  check(item: ManualPayoutWindow): string[];
}

export class ManualPayoutWindowLabelLengthRule implements ManualPayoutWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPayoutWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPayoutWindowCodeLengthRule implements ManualPayoutWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPayoutWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPayoutWindowRequiredLabelRule implements ManualPayoutWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPayoutWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPayoutWindowRequiredCodeRule implements ManualPayoutWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPayoutWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPayoutWindowCodePrefixRule implements ManualPayoutWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualPayoutWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualPayoutWindowRatioRangeRule implements ManualPayoutWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPayoutWindow): string[] {
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

/** Runs every rule of a manual payout window. */
export class ManualPayoutWindowValidator {
  rules: ManualPayoutWindowRule[];

  constructor(rules: ManualPayoutWindowRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPayoutWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualPayoutWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPayoutWindow[]): Map<string, string[]> {
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

export function defaultManualPayoutWindowValidator(): ManualPayoutWindowValidator {
  return new ManualPayoutWindowValidator(
    [
      new ManualPayoutWindowLabelLengthRule(80),
      new ManualPayoutWindowCodeLengthRule(255),
      new ManualPayoutWindowRequiredLabelRule("manual payout window needs this field"),
      new ManualPayoutWindowRequiredCodeRule("manual payout window needs an entry"),
      new ManualPayoutWindowCodePrefixRule("OPS"),
      new ManualPayoutWindowRatioRangeRule(8.1, 3397.3),
    ],
  );
}
