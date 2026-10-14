import { RollingModelThreshold } from "./rolling-model-threshold.js";

/** A rule a rolling model threshold must pass. Check returns its problems, or none. */
export interface RollingModelThresholdRule {
  check(item: RollingModelThreshold): string[];
}

export class RollingModelThresholdRequiredUnitRule implements RollingModelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingModelThreshold): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class RollingModelThresholdCodeLengthRule implements RollingModelThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingModelThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingModelThresholdRequiredCodeRule implements RollingModelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingModelThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingModelThresholdRequiredLabelRule implements RollingModelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingModelThreshold): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling model threshold. */
export class RollingModelThresholdValidator {
  rules: RollingModelThresholdRule[];

  constructor(rules: RollingModelThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: RollingModelThreshold): string[] {
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

  requireValid(item: RollingModelThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingModelThreshold[]): Map<string, string[]> {
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

export function defaultRollingModelThresholdValidator(): RollingModelThresholdValidator {
  return new RollingModelThresholdValidator(
    [
      new RollingModelThresholdRequiredUnitRule("rolling model threshold needs an entry"),
      new RollingModelThresholdCodeLengthRule(120),
      new RollingModelThresholdRequiredCodeRule("rolling model threshold needs an entry"),
      new RollingModelThresholdRequiredLabelRule("rolling model threshold needs this field"),
    ],
  );
}
