import { PlacementGroup } from "./placement-group.js";

/** A rule a placement group must pass. Check returns its problems, or none. */
export interface PlacementGroupRule {
  check(item: PlacementGroup): string[];
}

export class PlacementGroupCodePrefixRule implements PlacementGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PlacementGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PlacementGroupCodeLengthRule implements PlacementGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementGroupSourceLengthRule implements PlacementGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementGroup): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementGroupRequiredSourceRule implements PlacementGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementGroup): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementGroupWeightRangeRule implements PlacementGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementGroup): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementGroupRequiredJourneyIdRule implements PlacementGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementGroup): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a placement group. */
export class PlacementGroupValidator {
  rules: PlacementGroupRule[];

  constructor(rules: PlacementGroupRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementGroup): string[] {
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

  requireValid(item: PlacementGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementGroup[]): Map<string, string[]> {
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

export function defaultPlacementGroupValidator(): PlacementGroupValidator {
  return new PlacementGroupValidator(
    [
      new PlacementGroupCodePrefixRule("REF"),
      new PlacementGroupCodeLengthRule(86400),
      new PlacementGroupSourceLengthRule(32),
      new PlacementGroupRequiredSourceRule("placement group needs a value"),
      new PlacementGroupWeightRangeRule(3.2, 2064.8),
      new PlacementGroupRequiredJourneyIdRule("placement group needs a value"),
    ],
  );
}
