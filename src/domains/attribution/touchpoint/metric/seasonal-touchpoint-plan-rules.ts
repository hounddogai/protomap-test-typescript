import { SeasonalTouchpointPlan } from "./seasonal-touchpoint-plan.js";

/** A rule a seasonal touchpoint plan must pass. Check returns its problems, or none. */
export interface SeasonalTouchpointPlanRule {
  check(item: SeasonalTouchpointPlan): string[];
}

export class SeasonalTouchpointPlanSegmentLengthRule implements SeasonalTouchpointPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalTouchpointPlan): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalTouchpointPlanCodePrefixRule implements SeasonalTouchpointPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalTouchpointPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalTouchpointPlanRequiredCountryRule implements SeasonalTouchpointPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalTouchpointPlan): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalTouchpointPlanCodeLengthRule implements SeasonalTouchpointPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalTouchpointPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalTouchpointPlanRequiredCodeRule implements SeasonalTouchpointPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalTouchpointPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal touchpoint plan. */
export class SeasonalTouchpointPlanValidator {
  rules: SeasonalTouchpointPlanRule[];

  constructor(rules: SeasonalTouchpointPlanRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalTouchpointPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalTouchpointPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalTouchpointPlan[]): Map<string, string[]> {
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

export function defaultSeasonalTouchpointPlanValidator(): SeasonalTouchpointPlanValidator {
  return new SeasonalTouchpointPlanValidator(
    [
      new SeasonalTouchpointPlanSegmentLengthRule(1000),
      new SeasonalTouchpointPlanCodePrefixRule("Q"),
      new SeasonalTouchpointPlanRequiredCountryRule("seasonal touchpoint plan needs an entry"),
      new SeasonalTouchpointPlanCodeLengthRule(16),
      new SeasonalTouchpointPlanRequiredCodeRule("seasonal touchpoint plan needs an entry"),
    ],
  );
}
