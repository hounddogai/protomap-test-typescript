import { WeightedFunnelAdjustment } from "./weighted-funnel-adjustment.js";

/** A rule a weighted funnel adjustment must pass. Check returns its problems, or none. */
export interface WeightedFunnelAdjustmentRule {
  check(item: WeightedFunnelAdjustment): string[];
}

export class WeightedFunnelAdjustmentCodePrefixRule implements WeightedFunnelAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedFunnelAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedFunnelAdjustmentOwnerIdLengthRule implements WeightedFunnelAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedFunnelAdjustment): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedFunnelAdjustmentRequiredOwnerIdRule implements WeightedFunnelAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedFunnelAdjustment): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedFunnelAdjustmentLabelLengthRule implements WeightedFunnelAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedFunnelAdjustment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedFunnelAdjustmentRequiredCodeRule implements WeightedFunnelAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedFunnelAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted funnel adjustment. */
export class WeightedFunnelAdjustmentValidator {
  rules: WeightedFunnelAdjustmentRule[];

  constructor(rules: WeightedFunnelAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedFunnelAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedFunnelAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedFunnelAdjustment[]): Map<string, string[]> {
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

export function defaultWeightedFunnelAdjustmentValidator(): WeightedFunnelAdjustmentValidator {
  return new WeightedFunnelAdjustmentValidator(
    [
      new WeightedFunnelAdjustmentCodePrefixRule("ACM"),
      new WeightedFunnelAdjustmentOwnerIdLengthRule(80),
      new WeightedFunnelAdjustmentRequiredOwnerIdRule("weighted funnel adjustment needs an entry"),
      new WeightedFunnelAdjustmentLabelLengthRule(86400),
      new WeightedFunnelAdjustmentRequiredCodeRule("weighted funnel adjustment needs this field"),
    ],
  );
}
