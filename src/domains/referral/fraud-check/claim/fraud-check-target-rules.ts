import { FraudCheckTarget } from "./fraud-check-target.js";

/** A rule a fraud check target must pass. Check returns its problems, or none. */
export interface FraudCheckTargetRule {
  check(item: FraudCheckTarget): string[];
}

export class FraudCheckTargetRequiredCodeRule implements FraudCheckTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckTargetRequiredOwnerIdRule implements FraudCheckTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckTarget): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckTargetCostRangeRule implements FraudCheckTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckTarget): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FraudCheckTargetUnitLengthRule implements FraudCheckTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckTarget): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckTargetRequiredNameRule implements FraudCheckTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckTarget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckTargetPriorityRangeRule implements FraudCheckTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckTarget): string[] {
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

/** Runs every rule of a fraud check target. */
export class FraudCheckTargetValidator {
  rules: FraudCheckTargetRule[];

  constructor(rules: FraudCheckTargetRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckTarget): string[] {
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

  requireValid(item: FraudCheckTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckTarget[]): Map<string, string[]> {
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

export function defaultFraudCheckTargetValidator(): FraudCheckTargetValidator {
  return new FraudCheckTargetValidator(
    [
      new FraudCheckTargetRequiredCodeRule("fraud check target needs a value"),
      new FraudCheckTargetRequiredOwnerIdRule("fraud check target needs a value"),
      new FraudCheckTargetCostRangeRule(4.9, 328.7),
      new FraudCheckTargetUnitLengthRule(16),
      new FraudCheckTargetRequiredNameRule("fraud check target needs an entry"),
      new FraudCheckTargetPriorityRangeRule(32, 1000),
    ],
  );
}
