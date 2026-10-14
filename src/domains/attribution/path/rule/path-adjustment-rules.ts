import { PathAdjustment } from "./path-adjustment.js";

/** A rule a path adjustment must pass. Check returns its problems, or none. */
export interface PathAdjustmentRule {
  check(item: PathAdjustment): string[];
}

export class PathAdjustmentCodePrefixRule implements PathAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PathAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PathAdjustmentCapacityRangeRule implements PathAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathAdjustment): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PathAdjustmentRequiredVariantRule implements PathAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathAdjustment): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class PathAdjustmentVariantLengthRule implements PathAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathAdjustment): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a path adjustment. */
export class PathAdjustmentValidator {
  rules: PathAdjustmentRule[];

  constructor(rules: PathAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: PathAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PathAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathAdjustment[]): Map<string, string[]> {
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

export function defaultPathAdjustmentValidator(): PathAdjustmentValidator {
  return new PathAdjustmentValidator(
    [
      new PathAdjustmentCodePrefixRule("REF"),
      new PathAdjustmentCapacityRangeRule(86400, 86400),
      new PathAdjustmentRequiredVariantRule("path adjustment needs this field"),
      new PathAdjustmentVariantLengthRule(64),
    ],
  );
}
