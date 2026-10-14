import { DefaultTouchpointPlan } from "./default-touchpoint-plan.js";

/** A rule a default touchpoint plan must pass. Check returns its problems, or none. */
export interface DefaultTouchpointPlanRule {
  check(item: DefaultTouchpointPlan): string[];
}

export class DefaultTouchpointPlanCodePrefixRule implements DefaultTouchpointPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultTouchpointPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultTouchpointPlanDurationMinutesRangeRule implements DefaultTouchpointPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultTouchpointPlan): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultTouchpointPlanNameLengthRule implements DefaultTouchpointPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultTouchpointPlan): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultTouchpointPlanRequiredSummaryRule implements DefaultTouchpointPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultTouchpointPlan): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default touchpoint plan. */
export class DefaultTouchpointPlanValidator {
  rules: DefaultTouchpointPlanRule[];

  constructor(rules: DefaultTouchpointPlanRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultTouchpointPlan): string[] {
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

  requireValid(item: DefaultTouchpointPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultTouchpointPlan[]): Map<string, string[]> {
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

export function defaultDefaultTouchpointPlanValidator(): DefaultTouchpointPlanValidator {
  return new DefaultTouchpointPlanValidator(
    [
      new DefaultTouchpointPlanCodePrefixRule("REF"),
      new DefaultTouchpointPlanDurationMinutesRangeRule(80, 1000),
      new DefaultTouchpointPlanNameLengthRule(86400),
      new DefaultTouchpointPlanRequiredSummaryRule("default touchpoint plan needs an entry"),
    ],
  );
}
