import { WeightedFlightPlan } from "./weighted-flight-plan.js";

/** A rule a weighted flight plan must pass. Check returns its problems, or none. */
export interface WeightedFlightPlanRule {
  check(item: WeightedFlightPlan): string[];
}

export class WeightedFlightPlanCodeLengthRule implements WeightedFlightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedFlightPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedFlightPlanRequiredContactEmailRule implements WeightedFlightPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedFlightPlan): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedFlightPlanCodePrefixRule implements WeightedFlightPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedFlightPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedFlightPlanRequiredCampaignRefRule implements WeightedFlightPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedFlightPlan): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted flight plan. */
export class WeightedFlightPlanValidator {
  rules: WeightedFlightPlanRule[];

  constructor(rules: WeightedFlightPlanRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedFlightPlan): string[] {
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

  requireValid(item: WeightedFlightPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedFlightPlan[]): Map<string, string[]> {
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

export function defaultWeightedFlightPlanValidator(): WeightedFlightPlanValidator {
  return new WeightedFlightPlanValidator(
    [
      new WeightedFlightPlanCodeLengthRule(80),
      new WeightedFlightPlanRequiredContactEmailRule("weighted flight plan needs this field"),
      new WeightedFlightPlanCodePrefixRule("X"),
      new WeightedFlightPlanRequiredCampaignRefRule("weighted flight plan needs this field"),
    ],
  );
}
