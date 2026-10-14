import { DefaultRedemptionOverride } from "./default-redemption-override.js";

/** A rule a default redemption override must pass. Check returns its problems, or none. */
export interface DefaultRedemptionOverrideRule {
  check(item: DefaultRedemptionOverride): string[];
}

export class DefaultRedemptionOverrideTimezoneLengthRule implements DefaultRedemptionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultRedemptionOverride): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultRedemptionOverrideRequiredCodeRule implements DefaultRedemptionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultRedemptionOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultRedemptionOverrideCeilingRangeRule implements DefaultRedemptionOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultRedemptionOverride): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultRedemptionOverrideCodeLengthRule implements DefaultRedemptionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultRedemptionOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultRedemptionOverrideRequiredLabelRule implements DefaultRedemptionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultRedemptionOverride): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultRedemptionOverrideRequiredNotesRule implements DefaultRedemptionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultRedemptionOverride): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default redemption override. */
export class DefaultRedemptionOverrideValidator {
  rules: DefaultRedemptionOverrideRule[];

  constructor(rules: DefaultRedemptionOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultRedemptionOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultRedemptionOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultRedemptionOverride[]): Map<string, string[]> {
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

export function defaultDefaultRedemptionOverrideValidator(): DefaultRedemptionOverrideValidator {
  return new DefaultRedemptionOverrideValidator(
    [
      new DefaultRedemptionOverrideTimezoneLengthRule(1000),
      new DefaultRedemptionOverrideRequiredCodeRule("default redemption override needs an entry"),
      new DefaultRedemptionOverrideCeilingRangeRule(2, 1248.1),
      new DefaultRedemptionOverrideCodeLengthRule(64),
      new DefaultRedemptionOverrideRequiredLabelRule("default redemption override needs a value"),
      new DefaultRedemptionOverrideRequiredNotesRule("default redemption override needs an entry"),
    ],
  );
}
