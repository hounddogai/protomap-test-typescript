import { ScheduledModelAdjustment } from "./scheduled-model-adjustment.js";

/** A rule a scheduled model adjustment must pass. Check returns its problems, or none. */
export interface ScheduledModelAdjustmentRule {
  check(item: ScheduledModelAdjustment): string[];
}

export class ScheduledModelAdjustmentCodeLengthRule implements ScheduledModelAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledModelAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledModelAdjustmentRequiredCodeRule implements ScheduledModelAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledModelAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledModelAdjustmentCodePrefixRule implements ScheduledModelAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledModelAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledModelAdjustmentRequiredOwnerIdRule implements ScheduledModelAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledModelAdjustment): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledModelAdjustmentFrequencyCapRangeRule implements ScheduledModelAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledModelAdjustment): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a scheduled model adjustment. */
export class ScheduledModelAdjustmentValidator {
  rules: ScheduledModelAdjustmentRule[];

  constructor(rules: ScheduledModelAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledModelAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledModelAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledModelAdjustment[]): Map<string, string[]> {
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

export function defaultScheduledModelAdjustmentValidator(): ScheduledModelAdjustmentValidator {
  return new ScheduledModelAdjustmentValidator(
    [
      new ScheduledModelAdjustmentCodeLengthRule(3600),
      new ScheduledModelAdjustmentRequiredCodeRule("scheduled model adjustment needs a value"),
      new ScheduledModelAdjustmentCodePrefixRule("OPS"),
      new ScheduledModelAdjustmentRequiredOwnerIdRule("scheduled model adjustment needs a value"),
      new ScheduledModelAdjustmentFrequencyCapRangeRule(16, 120),
    ],
  );
}
