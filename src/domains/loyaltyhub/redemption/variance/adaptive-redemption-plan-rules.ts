import { AdaptiveRedemptionPlan } from "./adaptive-redemption-plan.js";

/** A rule a adaptive redemption plan must pass. Check returns its problems, or none. */
export interface AdaptiveRedemptionPlanRule {
  check(item: AdaptiveRedemptionPlan): string[];
}

export class AdaptiveRedemptionPlanRequiredTitleRule implements AdaptiveRedemptionPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveRedemptionPlan): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveRedemptionPlanCodePrefixRule implements AdaptiveRedemptionPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveRedemptionPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveRedemptionPlanCohortLengthRule implements AdaptiveRedemptionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveRedemptionPlan): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveRedemptionPlanRequiredCohortRule implements AdaptiveRedemptionPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveRedemptionPlan): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveRedemptionPlanOwnerIdLengthRule implements AdaptiveRedemptionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveRedemptionPlan): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive redemption plan. */
export class AdaptiveRedemptionPlanValidator {
  rules: AdaptiveRedemptionPlanRule[];

  constructor(rules: AdaptiveRedemptionPlanRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveRedemptionPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveRedemptionPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveRedemptionPlan[]): Map<string, string[]> {
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

export function defaultAdaptiveRedemptionPlanValidator(): AdaptiveRedemptionPlanValidator {
  return new AdaptiveRedemptionPlanValidator(
    [
      new AdaptiveRedemptionPlanRequiredTitleRule("adaptive redemption plan needs a value"),
      new AdaptiveRedemptionPlanCodePrefixRule("ACM"),
      new AdaptiveRedemptionPlanCohortLengthRule(1000),
      new AdaptiveRedemptionPlanRequiredCohortRule("adaptive redemption plan needs an entry"),
      new AdaptiveRedemptionPlanOwnerIdLengthRule(16),
    ],
  );
}
