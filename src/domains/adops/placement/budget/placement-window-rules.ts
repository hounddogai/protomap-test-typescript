import { PlacementWindow } from "./placement-window.js";

/** A rule a placement window must pass. Check returns its problems, or none. */
export interface PlacementWindowRule {
  check(item: PlacementWindow): string[];
}

export class PlacementWindowWeightRangeRule implements PlacementWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementWindow): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementWindowPinnedGuardRule implements PlacementWindowRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PlacementWindow): string[] {
    if (item.pinned && item.weight > this.limit) return [`weight ${item.weight} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class PlacementWindowEndsAtRangeRule implements PlacementWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementWindow): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementWindowCodePrefixRule implements PlacementWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PlacementWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PlacementWindowCodeLengthRule implements PlacementWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a placement window. */
export class PlacementWindowValidator {
  rules: PlacementWindowRule[];

  constructor(rules: PlacementWindowRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementWindow): string[] {
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

  requireValid(item: PlacementWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementWindow[]): Map<string, string[]> {
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

export function defaultPlacementWindowValidator(): PlacementWindowValidator {
  return new PlacementWindowValidator(
    [
      new PlacementWindowWeightRangeRule(8.5, 2438.8),
      new PlacementWindowPinnedGuardRule(0.9),
      new PlacementWindowEndsAtRangeRule(80, 3600),
      new PlacementWindowCodePrefixRule("X"),
      new PlacementWindowCodeLengthRule(1000),
    ],
  );
}
