import { AdaptiveWaitAdjustment } from "./adaptive-wait-adjustment.js";

/** A rule a adaptive wait adjustment must pass. Check returns its problems, or none. */
export interface AdaptiveWaitAdjustmentRule {
  check(item: AdaptiveWaitAdjustment): string[];
}

export class AdaptiveWaitAdjustmentRequiredJourneyIdRule implements AdaptiveWaitAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveWaitAdjustment): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveWaitAdjustmentCodePrefixRule implements AdaptiveWaitAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveWaitAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveWaitAdjustmentBudgetRangeRule implements AdaptiveWaitAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveWaitAdjustment): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveWaitAdjustmentRequiredNameRule implements AdaptiveWaitAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveWaitAdjustment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveWaitAdjustmentRequiredCodeRule implements AdaptiveWaitAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveWaitAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveWaitAdjustmentNameLengthRule implements AdaptiveWaitAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveWaitAdjustment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive wait adjustment. */
export class AdaptiveWaitAdjustmentValidator {
  rules: AdaptiveWaitAdjustmentRule[];

  constructor(rules: AdaptiveWaitAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveWaitAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveWaitAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveWaitAdjustment[]): Map<string, string[]> {
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

export function defaultAdaptiveWaitAdjustmentValidator(): AdaptiveWaitAdjustmentValidator {
  return new AdaptiveWaitAdjustmentValidator(
    [
      new AdaptiveWaitAdjustmentRequiredJourneyIdRule("adaptive wait adjustment needs an entry"),
      new AdaptiveWaitAdjustmentCodePrefixRule("Q"),
      new AdaptiveWaitAdjustmentBudgetRangeRule(7.1, 4703.5),
      new AdaptiveWaitAdjustmentRequiredNameRule("adaptive wait adjustment needs an entry"),
      new AdaptiveWaitAdjustmentRequiredCodeRule("adaptive wait adjustment needs an entry"),
      new AdaptiveWaitAdjustmentNameLengthRule(16),
    ],
  );
}
