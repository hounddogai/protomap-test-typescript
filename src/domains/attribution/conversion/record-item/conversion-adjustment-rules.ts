import { ConversionAdjustment } from "./conversion-adjustment.js";

/** A rule a conversion adjustment must pass. Check returns its problems, or none. */
export interface ConversionAdjustmentRule {
  check(item: ConversionAdjustment): string[];
}

export class ConversionAdjustmentRequiredTitleRule implements ConversionAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionAdjustmentCodeLengthRule implements ConversionAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionAdjustmentRequiredDescriptionRule implements ConversionAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionAdjustment): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionAdjustmentBidRangeRule implements ConversionAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionAdjustment): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ConversionAdjustmentSequenceRangeRule implements ConversionAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionAdjustment): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ConversionAdjustmentBudgetRangeRule implements ConversionAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionAdjustment): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a conversion adjustment. */
export class ConversionAdjustmentValidator {
  rules: ConversionAdjustmentRule[];

  constructor(rules: ConversionAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionAdjustment): string[] {
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

  requireValid(item: ConversionAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionAdjustment[]): Map<string, string[]> {
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

export function defaultConversionAdjustmentValidator(): ConversionAdjustmentValidator {
  return new ConversionAdjustmentValidator(
    [
      new ConversionAdjustmentRequiredTitleRule("conversion adjustment needs a value"),
      new ConversionAdjustmentCodeLengthRule(255),
      new ConversionAdjustmentRequiredDescriptionRule("conversion adjustment needs an entry"),
      new ConversionAdjustmentBidRangeRule(8, 3065.2),
      new ConversionAdjustmentSequenceRangeRule(16, 32),
      new ConversionAdjustmentBudgetRangeRule(4.7, 1604.2),
    ],
  );
}
