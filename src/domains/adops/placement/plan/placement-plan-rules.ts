import { PlacementPlan } from "./placement-plan.js";

/** A rule a placement plan must pass. Check returns its problems, or none. */
export interface PlacementPlanRule {
  check(item: PlacementPlan): string[];
}

export class PlacementPlanLocaleLengthRule implements PlacementPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementPlan): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementPlanUpdatedAtRangeRule implements PlacementPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementPlan): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementPlanRequiredChannelRule implements PlacementPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementPlan): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementPlanRequiredCodeRule implements PlacementPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a placement plan. */
export class PlacementPlanValidator {
  rules: PlacementPlanRule[];

  constructor(rules: PlacementPlanRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementPlan): string[] {
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

  requireValid(item: PlacementPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementPlan[]): Map<string, string[]> {
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

export function defaultPlacementPlanValidator(): PlacementPlanValidator {
  return new PlacementPlanValidator(
    [
      new PlacementPlanLocaleLengthRule(32),
      new PlacementPlanUpdatedAtRangeRule(80, 1000),
      new PlacementPlanRequiredChannelRule("placement plan needs this field"),
      new PlacementPlanRequiredCodeRule("placement plan needs a value"),
    ],
  );
}
