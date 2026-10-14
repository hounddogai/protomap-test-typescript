import { PlacementCheckpoint } from "./placement-checkpoint.js";

/** A rule a placement checkpoint must pass. Check returns its problems, or none. */
export interface PlacementCheckpointRule {
  check(item: PlacementCheckpoint): string[];
}

export class PlacementCheckpointVisibleGuardRule implements PlacementCheckpointRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PlacementCheckpoint): string[] {
    if (item.visible && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class PlacementCheckpointRevisionRangeRule implements PlacementCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementCheckpoint): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementCheckpointRequiredCountryRule implements PlacementCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementCheckpoint): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementCheckpointRequiredCodeRule implements PlacementCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementCheckpointClicksRangeRule implements PlacementCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementCheckpoint): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a placement checkpoint. */
export class PlacementCheckpointValidator {
  rules: PlacementCheckpointRule[];

  constructor(rules: PlacementCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementCheckpoint[]): Map<string, string[]> {
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

export function defaultPlacementCheckpointValidator(): PlacementCheckpointValidator {
  return new PlacementCheckpointValidator(
    [
      new PlacementCheckpointVisibleGuardRule(16),
      new PlacementCheckpointRevisionRangeRule(80, 1000),
      new PlacementCheckpointRequiredCountryRule("placement checkpoint needs this field"),
      new PlacementCheckpointRequiredCodeRule("placement checkpoint needs this field"),
      new PlacementCheckpointClicksRangeRule(16, 120),
    ],
  );
}
