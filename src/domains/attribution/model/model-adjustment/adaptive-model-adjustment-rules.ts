import * as text from "../../../../kit/text.js";
import { AdaptiveModelAdjustment } from "./adaptive-model-adjustment.js";

/** A rule a adaptive model adjustment must pass. Check returns its problems, or none. */
export interface AdaptiveModelAdjustmentRule {
  check(item: AdaptiveModelAdjustment): string[];
}

export class AdaptiveModelAdjustmentAllowedTitleRule implements AdaptiveModelAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveModelAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is missing`];
    return [];
  }
}

export class AdaptiveModelAdjustmentCodePrefixRule implements AdaptiveModelAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveModelAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveModelAdjustmentCodeLengthRule implements AdaptiveModelAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveModelAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveModelAdjustmentCreatedAtRangeRule implements AdaptiveModelAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveModelAdjustment): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveModelAdjustmentRequiredCodeRule implements AdaptiveModelAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveModelAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive model adjustment. */
export class AdaptiveModelAdjustmentValidator {
  rules: AdaptiveModelAdjustmentRule[];

  constructor(rules: AdaptiveModelAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveModelAdjustment): string[] {
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

  requireValid(item: AdaptiveModelAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveModelAdjustment[]): Map<string, string[]> {
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

export function defaultAdaptiveModelAdjustmentValidator(): AdaptiveModelAdjustmentValidator {
  return new AdaptiveModelAdjustmentValidator(
    [
      new AdaptiveModelAdjustmentAllowedTitleRule(["manual"]),
      new AdaptiveModelAdjustmentCodePrefixRule("OPS"),
      new AdaptiveModelAdjustmentCodeLengthRule(120),
      new AdaptiveModelAdjustmentCreatedAtRangeRule(64, 120),
      new AdaptiveModelAdjustmentRequiredCodeRule("adaptive model adjustment needs an entry"),
    ],
  );
}
