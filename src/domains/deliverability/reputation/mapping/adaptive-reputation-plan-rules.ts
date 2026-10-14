import { AdaptiveReputationPlan } from "./adaptive-reputation-plan.js";

/** A rule a adaptive reputation plan must pass. Check returns its problems, or none. */
export interface AdaptiveReputationPlanRule {
  check(item: AdaptiveReputationPlan): string[];
}

export class AdaptiveReputationPlanCodeLengthRule implements AdaptiveReputationPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveReputationPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveReputationPlanRequiredNameRule implements AdaptiveReputationPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveReputationPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveReputationPlanRequiredTimezoneRule implements AdaptiveReputationPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveReputationPlan): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveReputationPlanChannelLengthRule implements AdaptiveReputationPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveReputationPlan): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive reputation plan. */
export class AdaptiveReputationPlanValidator {
  rules: AdaptiveReputationPlanRule[];

  constructor(rules: AdaptiveReputationPlanRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveReputationPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveReputationPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveReputationPlan[]): Map<string, string[]> {
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

export function defaultAdaptiveReputationPlanValidator(): AdaptiveReputationPlanValidator {
  return new AdaptiveReputationPlanValidator(
    [
      new AdaptiveReputationPlanCodeLengthRule(64),
      new AdaptiveReputationPlanRequiredNameRule("adaptive reputation plan needs a value"),
      new AdaptiveReputationPlanRequiredTimezoneRule("adaptive reputation plan needs a value"),
      new AdaptiveReputationPlanChannelLengthRule(32),
    ],
  );
}
