import { TouchpointThreshold } from "./touchpoint-threshold.js";

/** A rule a touchpoint threshold must pass. Check returns its problems, or none. */
export interface TouchpointThresholdRule {
  check(item: TouchpointThreshold): string[];
}

export class TouchpointThresholdApprovedGuardRule implements TouchpointThresholdRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TouchpointThreshold): string[] {
    if (item.approved && item.retries > this.limit) return [`retries ${item.retries} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class TouchpointThresholdRequiredLabelRule implements TouchpointThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointThreshold): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointThresholdRequiredCodeRule implements TouchpointThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a touchpoint threshold. */
export class TouchpointThresholdValidator {
  rules: TouchpointThresholdRule[];

  constructor(rules: TouchpointThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TouchpointThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointThreshold[]): Map<string, string[]> {
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

export function defaultTouchpointThresholdValidator(): TouchpointThresholdValidator {
  return new TouchpointThresholdValidator(
    [
      new TouchpointThresholdApprovedGuardRule(86400),
      new TouchpointThresholdRequiredLabelRule("touchpoint threshold needs this field"),
      new TouchpointThresholdRequiredCodeRule("touchpoint threshold needs this field"),
    ],
  );
}
