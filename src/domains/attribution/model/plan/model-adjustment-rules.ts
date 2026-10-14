import * as text from "../../../../kit/text.js";
import { ModelAdjustment } from "./model-adjustment.js";

/** A rule a model adjustment must pass. Check returns its problems, or none. */
export interface ModelAdjustmentRule {
  check(item: ModelAdjustment): string[];
}

export class ModelAdjustmentAllowedTimezoneRule implements ModelAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ModelAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is inconsistent`];
    return [];
  }
}

export class ModelAdjustmentCodeLengthRule implements ModelAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelAdjustmentLocaleLengthRule implements ModelAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelAdjustment): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelAdjustmentCodePrefixRule implements ModelAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ModelAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ModelAdjustmentRequiredLabelRule implements ModelAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelAdjustment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ModelAdjustmentRequiredLocaleRule implements ModelAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelAdjustment): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a model adjustment. */
export class ModelAdjustmentValidator {
  rules: ModelAdjustmentRule[];

  constructor(rules: ModelAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ModelAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelAdjustment[]): Map<string, string[]> {
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

export function defaultModelAdjustmentValidator(): ModelAdjustmentValidator {
  return new ModelAdjustmentValidator(
    [
      new ModelAdjustmentAllowedTimezoneRule(["regional"]),
      new ModelAdjustmentCodeLengthRule(16),
      new ModelAdjustmentLocaleLengthRule(32),
      new ModelAdjustmentCodePrefixRule("OPS"),
      new ModelAdjustmentRequiredLabelRule("model adjustment needs this field"),
      new ModelAdjustmentRequiredLocaleRule("model adjustment needs a value"),
    ],
  );
}
