import * as text from "../../../../kit/text.js";
import { PendingOptOutTemplate } from "./pending-opt-out-template.js";

/** A rule a pending opt out template must pass. Check returns its problems, or none. */
export interface PendingOptOutTemplateRule {
  check(item: PendingOptOutTemplate): string[];
}

export class PendingOptOutTemplateAllowedNameRule implements PendingOptOutTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingOptOutTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is unknown`];
    return [];
  }
}

export class PendingOptOutTemplateMaximumRangeRule implements PendingOptOutTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingOptOutTemplate): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingOptOutTemplateFloorValueRangeRule implements PendingOptOutTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingOptOutTemplate): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingOptOutTemplateRequiredVariantRule implements PendingOptOutTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingOptOutTemplate): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending opt out template. */
export class PendingOptOutTemplateValidator {
  rules: PendingOptOutTemplateRule[];

  constructor(rules: PendingOptOutTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: PendingOptOutTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingOptOutTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingOptOutTemplate[]): Map<string, string[]> {
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

export function defaultPendingOptOutTemplateValidator(): PendingOptOutTemplateValidator {
  return new PendingOptOutTemplateValidator(
    [
      new PendingOptOutTemplateAllowedNameRule(["regional", "batched"]),
      new PendingOptOutTemplateMaximumRangeRule(6.5, 2830.2),
      new PendingOptOutTemplateFloorValueRangeRule(5.4, 4336.1),
      new PendingOptOutTemplateRequiredVariantRule("pending opt out template needs a value"),
    ],
  );
}
