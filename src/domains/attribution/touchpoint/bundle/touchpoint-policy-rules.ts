import { TouchpointPolicy } from "./touchpoint-policy.js";

/** A rule a touchpoint policy must pass. Check returns its problems, or none. */
export interface TouchpointPolicyRule {
  check(item: TouchpointPolicy): string[];
}

export class TouchpointPolicyWeightRangeRule implements TouchpointPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointPolicy): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TouchpointPolicyBidRangeRule implements TouchpointPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointPolicy): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TouchpointPolicyRequiredLocaleRule implements TouchpointPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointPolicy): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a touchpoint policy. */
export class TouchpointPolicyValidator {
  rules: TouchpointPolicyRule[];

  constructor(rules: TouchpointPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointPolicy): string[] {
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

  requireValid(item: TouchpointPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointPolicy[]): Map<string, string[]> {
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

export function defaultTouchpointPolicyValidator(): TouchpointPolicyValidator {
  return new TouchpointPolicyValidator(
    [
      new TouchpointPolicyWeightRangeRule(5.9, 4549),
      new TouchpointPolicyBidRangeRule(6.5, 64.8),
      new TouchpointPolicyRequiredLocaleRule("touchpoint policy needs a value"),
    ],
  );
}
