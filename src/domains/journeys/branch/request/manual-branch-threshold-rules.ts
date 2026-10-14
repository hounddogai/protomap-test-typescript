import { ManualBranchThreshold } from "./manual-branch-threshold.js";

/** A rule a manual branch threshold must pass. Check returns its problems, or none. */
export interface ManualBranchThresholdRule {
  check(item: ManualBranchThreshold): string[];
}

export class ManualBranchThresholdQuantityRangeRule implements ManualBranchThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualBranchThreshold): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualBranchThresholdRequiredExternalRefRule implements ManualBranchThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBranchThreshold): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class ManualBranchThresholdRequiredNameRule implements ManualBranchThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBranchThreshold): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual branch threshold. */
export class ManualBranchThresholdValidator {
  rules: ManualBranchThresholdRule[];

  constructor(rules: ManualBranchThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: ManualBranchThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualBranchThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualBranchThreshold[]): Map<string, string[]> {
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

export function defaultManualBranchThresholdValidator(): ManualBranchThresholdValidator {
  return new ManualBranchThresholdValidator(
    [
      new ManualBranchThresholdQuantityRangeRule(64, 80),
      new ManualBranchThresholdRequiredExternalRefRule("manual branch threshold needs this field"),
      new ManualBranchThresholdRequiredNameRule("manual branch threshold needs a value"),
    ],
  );
}
