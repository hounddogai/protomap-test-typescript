import * as text from "../../../../kit/text.js";
import { GlobalPlacementAdjustment } from "./global-placement-adjustment.js";

/** A rule a global placement adjustment must pass. Check returns its problems, or none. */
export interface GlobalPlacementAdjustmentRule {
  check(item: GlobalPlacementAdjustment): string[];
}

export class GlobalPlacementAdjustmentAllowedCountryRule implements GlobalPlacementAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalPlacementAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is below minimum`];
    return [];
  }
}

export class GlobalPlacementAdjustmentRequiredCodeRule implements GlobalPlacementAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPlacementAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalPlacementAdjustmentRequiredTitleRule implements GlobalPlacementAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPlacementAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalPlacementAdjustmentArchivedGuardRule implements GlobalPlacementAdjustmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalPlacementAdjustment): string[] {
    if (item.archived && item.startsAt > this.limit) return [`starts at ${item.startsAt} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a global placement adjustment. */
export class GlobalPlacementAdjustmentValidator {
  rules: GlobalPlacementAdjustmentRule[];

  constructor(rules: GlobalPlacementAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalPlacementAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalPlacementAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalPlacementAdjustment[]): Map<string, string[]> {
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

export function defaultGlobalPlacementAdjustmentValidator(): GlobalPlacementAdjustmentValidator {
  return new GlobalPlacementAdjustmentValidator(
    [
      new GlobalPlacementAdjustmentAllowedCountryRule(["rolling", "primary"]),
      new GlobalPlacementAdjustmentRequiredCodeRule("global placement adjustment needs a value"),
      new GlobalPlacementAdjustmentRequiredTitleRule("global placement adjustment needs a value"),
      new GlobalPlacementAdjustmentArchivedGuardRule(32),
    ],
  );
}
