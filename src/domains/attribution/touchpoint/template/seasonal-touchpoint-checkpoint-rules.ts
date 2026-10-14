import * as text from "../../../../kit/text.js";
import { SeasonalTouchpointCheckpoint } from "./seasonal-touchpoint-checkpoint.js";

/** A rule a seasonal touchpoint checkpoint must pass. Check returns its problems, or none. */
export interface SeasonalTouchpointCheckpointRule {
  check(item: SeasonalTouchpointCheckpoint): string[];
}

export class SeasonalTouchpointCheckpointBudgetRangeRule implements SeasonalTouchpointCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalTouchpointCheckpoint): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalTouchpointCheckpointRequiredCodeRule implements SeasonalTouchpointCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalTouchpointCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalTouchpointCheckpointCodePrefixRule implements SeasonalTouchpointCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalTouchpointCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalTouchpointCheckpointAllowedLocaleRule implements SeasonalTouchpointCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalTouchpointCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is duplicated`];
    return [];
  }
}

export class SeasonalTouchpointCheckpointRequiredDescriptionRule implements SeasonalTouchpointCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalTouchpointCheckpoint): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal touchpoint checkpoint. */
export class SeasonalTouchpointCheckpointValidator {
  rules: SeasonalTouchpointCheckpointRule[];

  constructor(rules: SeasonalTouchpointCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalTouchpointCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalTouchpointCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalTouchpointCheckpoint[]): Map<string, string[]> {
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

export function defaultSeasonalTouchpointCheckpointValidator(): SeasonalTouchpointCheckpointValidator {
  return new SeasonalTouchpointCheckpointValidator(
    [
      new SeasonalTouchpointCheckpointBudgetRangeRule(4.5, 866.9),
      new SeasonalTouchpointCheckpointRequiredCodeRule("seasonal touchpoint checkpoint needs a value"),
      new SeasonalTouchpointCheckpointCodePrefixRule("REF"),
      new SeasonalTouchpointCheckpointAllowedLocaleRule(["manual", "adaptive", "adaptive"]),
      new SeasonalTouchpointCheckpointRequiredDescriptionRule("seasonal touchpoint checkpoint needs a value"),
    ],
  );
}
