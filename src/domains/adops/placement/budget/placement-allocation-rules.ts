import * as text from "../../../../kit/text.js";
import { PlacementAllocation } from "./placement-allocation.js";

/** A rule a placement allocation must pass. Check returns its problems, or none. */
export interface PlacementAllocationRule {
  check(item: PlacementAllocation): string[];
}

export class PlacementAllocationThresholdRangeRule implements PlacementAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementAllocation): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementAllocationPinnedGuardRule implements PlacementAllocationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PlacementAllocation): string[] {
    if (item.pinned && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class PlacementAllocationRequiredLabelRule implements PlacementAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementAllocation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementAllocationRequiredCodeRule implements PlacementAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementAllocationAllowedCodeRule implements PlacementAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PlacementAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

/** Runs every rule of a placement allocation. */
export class PlacementAllocationValidator {
  rules: PlacementAllocationRule[];

  constructor(rules: PlacementAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementAllocation[]): Map<string, string[]> {
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

export function defaultPlacementAllocationValidator(): PlacementAllocationValidator {
  return new PlacementAllocationValidator(
    [
      new PlacementAllocationThresholdRangeRule(1, 324.3),
      new PlacementAllocationPinnedGuardRule(32),
      new PlacementAllocationRequiredLabelRule("placement allocation needs an entry"),
      new PlacementAllocationRequiredCodeRule("placement allocation needs a value"),
      new PlacementAllocationAllowedCodeRule(["scheduled", "fallback"]),
    ],
  );
}
