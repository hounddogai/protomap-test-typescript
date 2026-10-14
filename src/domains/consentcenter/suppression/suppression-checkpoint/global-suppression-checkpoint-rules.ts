import * as text from "../../../../kit/text.js";
import { GlobalSuppressionCheckpoint } from "./global-suppression-checkpoint.js";

/** A rule a global suppression checkpoint must pass. Check returns its problems, or none. */
export interface GlobalSuppressionCheckpointRule {
  check(item: GlobalSuppressionCheckpoint): string[];
}

export class GlobalSuppressionCheckpointCodePrefixRule implements GlobalSuppressionCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalSuppressionCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalSuppressionCheckpointRequiredCodeRule implements GlobalSuppressionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalSuppressionCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalSuppressionCheckpointAllowedCodeRule implements GlobalSuppressionCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalSuppressionCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class GlobalSuppressionCheckpointBudgetRangeRule implements GlobalSuppressionCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSuppressionCheckpoint): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalSuppressionCheckpointSendAtRangeRule implements GlobalSuppressionCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSuppressionCheckpoint): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalSuppressionCheckpointDiscountRangeRule implements GlobalSuppressionCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSuppressionCheckpoint): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a global suppression checkpoint. */
export class GlobalSuppressionCheckpointValidator {
  rules: GlobalSuppressionCheckpointRule[];

  constructor(rules: GlobalSuppressionCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalSuppressionCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalSuppressionCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalSuppressionCheckpoint[]): Map<string, string[]> {
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

export function defaultGlobalSuppressionCheckpointValidator(): GlobalSuppressionCheckpointValidator {
  return new GlobalSuppressionCheckpointValidator(
    [
      new GlobalSuppressionCheckpointCodePrefixRule("Q"),
      new GlobalSuppressionCheckpointRequiredCodeRule("global suppression checkpoint needs this field"),
      new GlobalSuppressionCheckpointAllowedCodeRule(["weighted"]),
      new GlobalSuppressionCheckpointBudgetRangeRule(1.1, 3225.5),
      new GlobalSuppressionCheckpointSendAtRangeRule(80, 86400),
      new GlobalSuppressionCheckpointDiscountRangeRule(5.2, 3421.2),
    ],
  );
}
