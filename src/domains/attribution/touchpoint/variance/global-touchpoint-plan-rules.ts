import { GlobalTouchpointPlan } from "./global-touchpoint-plan.js";

/** A rule a global touchpoint plan must pass. Check returns its problems, or none. */
export interface GlobalTouchpointPlanRule {
  check(item: GlobalTouchpointPlan): string[];
}

export class GlobalTouchpointPlanRequiredNameRule implements GlobalTouchpointPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalTouchpointPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalTouchpointPlanMinimumRangeRule implements GlobalTouchpointPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalTouchpointPlan): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalTouchpointPlanPriorityRangeRule implements GlobalTouchpointPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalTouchpointPlan): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalTouchpointPlanBatchSizeRangeRule implements GlobalTouchpointPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalTouchpointPlan): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a global touchpoint plan. */
export class GlobalTouchpointPlanValidator {
  rules: GlobalTouchpointPlanRule[];

  constructor(rules: GlobalTouchpointPlanRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalTouchpointPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalTouchpointPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalTouchpointPlan[]): Map<string, string[]> {
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

export function defaultGlobalTouchpointPlanValidator(): GlobalTouchpointPlanValidator {
  return new GlobalTouchpointPlanValidator(
    [
      new GlobalTouchpointPlanRequiredNameRule("global touchpoint plan needs this field"),
      new GlobalTouchpointPlanMinimumRangeRule(4.8, 3283.3),
      new GlobalTouchpointPlanPriorityRangeRule(80, 3600),
      new GlobalTouchpointPlanBatchSizeRangeRule(3600, 86400),
    ],
  );
}
