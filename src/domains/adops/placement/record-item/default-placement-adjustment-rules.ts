import { DefaultPlacementAdjustment } from "./default-placement-adjustment.js";

/** A rule a default placement adjustment must pass. Check returns its problems, or none. */
export interface DefaultPlacementAdjustmentRule {
  check(item: DefaultPlacementAdjustment): string[];
}

export class DefaultPlacementAdjustmentRequiredLabelRule implements DefaultPlacementAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPlacementAdjustment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPlacementAdjustmentLabelLengthRule implements DefaultPlacementAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPlacementAdjustment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPlacementAdjustmentCodePrefixRule implements DefaultPlacementAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultPlacementAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a default placement adjustment. */
export class DefaultPlacementAdjustmentValidator {
  rules: DefaultPlacementAdjustmentRule[];

  constructor(rules: DefaultPlacementAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPlacementAdjustment): string[] {
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

  requireValid(item: DefaultPlacementAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPlacementAdjustment[]): Map<string, string[]> {
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

export function defaultDefaultPlacementAdjustmentValidator(): DefaultPlacementAdjustmentValidator {
  return new DefaultPlacementAdjustmentValidator(
    [
      new DefaultPlacementAdjustmentRequiredLabelRule("default placement adjustment needs this field"),
      new DefaultPlacementAdjustmentLabelLengthRule(80),
      new DefaultPlacementAdjustmentCodePrefixRule("ACM"),
    ],
  );
}
