import { SeasonalApprovalAdjustment } from "./seasonal-approval-adjustment.js";

/** A rule a seasonal approval adjustment must pass. Check returns its problems, or none. */
export interface SeasonalApprovalAdjustmentRule {
  check(item: SeasonalApprovalAdjustment): string[];
}

export class SeasonalApprovalAdjustmentConversionRateRangeRule implements SeasonalApprovalAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalApprovalAdjustment): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalApprovalAdjustmentRequiredCodeRule implements SeasonalApprovalAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalApprovalAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalApprovalAdjustmentNameLengthRule implements SeasonalApprovalAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalApprovalAdjustment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalApprovalAdjustmentCodeLengthRule implements SeasonalApprovalAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalApprovalAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalApprovalAdjustmentLabelLengthRule implements SeasonalApprovalAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalApprovalAdjustment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalApprovalAdjustmentCodePrefixRule implements SeasonalApprovalAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalApprovalAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a seasonal approval adjustment. */
export class SeasonalApprovalAdjustmentValidator {
  rules: SeasonalApprovalAdjustmentRule[];

  constructor(rules: SeasonalApprovalAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalApprovalAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalApprovalAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalApprovalAdjustment[]): Map<string, string[]> {
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

export function defaultSeasonalApprovalAdjustmentValidator(): SeasonalApprovalAdjustmentValidator {
  return new SeasonalApprovalAdjustmentValidator(
    [
      new SeasonalApprovalAdjustmentConversionRateRangeRule(1.3, 1130.2),
      new SeasonalApprovalAdjustmentRequiredCodeRule("seasonal approval adjustment needs an entry"),
      new SeasonalApprovalAdjustmentNameLengthRule(86400),
      new SeasonalApprovalAdjustmentCodeLengthRule(80),
      new SeasonalApprovalAdjustmentLabelLengthRule(80),
      new SeasonalApprovalAdjustmentCodePrefixRule("REF"),
    ],
  );
}
