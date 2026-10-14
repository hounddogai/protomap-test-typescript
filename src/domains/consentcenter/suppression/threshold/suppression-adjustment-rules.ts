import * as text from "../../../../kit/text.js";
import { SuppressionAdjustment } from "./suppression-adjustment.js";

/** A rule a suppression adjustment must pass. Check returns its problems, or none. */
export interface SuppressionAdjustmentRule {
  check(item: SuppressionAdjustment): string[];
}

export class SuppressionAdjustmentRequiredTitleRule implements SuppressionAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionAdjustmentRequiredVariantRule implements SuppressionAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionAdjustment): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionAdjustmentAllowedSourceRule implements SuppressionAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SuppressionAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is not allowed`];
    return [];
  }
}

export class SuppressionAdjustmentRequiredCodeRule implements SuppressionAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a suppression adjustment. */
export class SuppressionAdjustmentValidator {
  rules: SuppressionAdjustmentRule[];

  constructor(rules: SuppressionAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionAdjustment): string[] {
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

  requireValid(item: SuppressionAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionAdjustment[]): Map<string, string[]> {
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

export function defaultSuppressionAdjustmentValidator(): SuppressionAdjustmentValidator {
  return new SuppressionAdjustmentValidator(
    [
      new SuppressionAdjustmentRequiredTitleRule("suppression adjustment needs a value"),
      new SuppressionAdjustmentRequiredVariantRule("suppression adjustment needs this field"),
      new SuppressionAdjustmentAllowedSourceRule(["regional"]),
      new SuppressionAdjustmentRequiredCodeRule("suppression adjustment needs a value"),
    ],
  );
}
