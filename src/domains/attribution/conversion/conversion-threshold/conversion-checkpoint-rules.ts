import * as text from "../../../../kit/text.js";
import { ConversionCheckpoint } from "./conversion-checkpoint.js";

/** A rule a conversion checkpoint must pass. Check returns its problems, or none. */
export interface ConversionCheckpointRule {
  check(item: ConversionCheckpoint): string[];
}

export class ConversionCheckpointCostRangeRule implements ConversionCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionCheckpoint): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ConversionCheckpointRequiredCodeRule implements ConversionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionCheckpointRequiredSourceRule implements ConversionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionCheckpoint): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionCheckpointAllowedCodeRule implements ConversionCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ConversionCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class ConversionCheckpointSourceLengthRule implements ConversionCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionCheckpoint): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionCheckpointRequiredLocaleRule implements ConversionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionCheckpoint): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a conversion checkpoint. */
export class ConversionCheckpointValidator {
  rules: ConversionCheckpointRule[];

  constructor(rules: ConversionCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ConversionCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionCheckpoint[]): Map<string, string[]> {
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

export function defaultConversionCheckpointValidator(): ConversionCheckpointValidator {
  return new ConversionCheckpointValidator(
    [
      new ConversionCheckpointCostRangeRule(8.1, 2070.4),
      new ConversionCheckpointRequiredCodeRule("conversion checkpoint needs a value"),
      new ConversionCheckpointRequiredSourceRule("conversion checkpoint needs this field"),
      new ConversionCheckpointAllowedCodeRule([]),
      new ConversionCheckpointSourceLengthRule(3600),
      new ConversionCheckpointRequiredLocaleRule("conversion checkpoint needs an entry"),
    ],
  );
}
