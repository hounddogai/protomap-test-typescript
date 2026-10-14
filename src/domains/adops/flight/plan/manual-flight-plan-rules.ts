import { ManualFlightPlan } from "./manual-flight-plan.js";

/** A rule a manual flight plan must pass. Check returns its problems, or none. */
export interface ManualFlightPlanRule {
  check(item: ManualFlightPlan): string[];
}

export class ManualFlightPlanNameLengthRule implements ManualFlightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualFlightPlan): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualFlightPlanSegmentLengthRule implements ManualFlightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualFlightPlan): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualFlightPlanRequiredExternalRefRule implements ManualFlightPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFlightPlan): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class ManualFlightPlanRequiredSegmentRule implements ManualFlightPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFlightPlan): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual flight plan. */
export class ManualFlightPlanValidator {
  rules: ManualFlightPlanRule[];

  constructor(rules: ManualFlightPlanRule[]) {
    this.rules = rules;
  }

  validate(item: ManualFlightPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualFlightPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualFlightPlan[]): Map<string, string[]> {
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

export function defaultManualFlightPlanValidator(): ManualFlightPlanValidator {
  return new ManualFlightPlanValidator(
    [
      new ManualFlightPlanNameLengthRule(80),
      new ManualFlightPlanSegmentLengthRule(86400),
      new ManualFlightPlanRequiredExternalRefRule("manual flight plan needs a value"),
      new ManualFlightPlanRequiredSegmentRule("manual flight plan needs a value"),
    ],
  );
}
