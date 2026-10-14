import { ActivationAdjustment } from "./activation-adjustment.js";

/** A rule a activation adjustment must pass. Check returns its problems, or none. */
export interface ActivationAdjustmentRule {
  check(item: ActivationAdjustment): string[];
}

export class ActivationAdjustmentTitleLengthRule implements ActivationAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationAdjustmentRequiredTitleRule implements ActivationAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationAdjustmentCodeLengthRule implements ActivationAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a activation adjustment. */
export class ActivationAdjustmentValidator {
  rules: ActivationAdjustmentRule[];

  constructor(rules: ActivationAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationAdjustment): string[] {
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

  requireValid(item: ActivationAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationAdjustment[]): Map<string, string[]> {
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

export function defaultActivationAdjustmentValidator(): ActivationAdjustmentValidator {
  return new ActivationAdjustmentValidator(
    [
      new ActivationAdjustmentTitleLengthRule(80),
      new ActivationAdjustmentRequiredTitleRule("activation adjustment needs a value"),
      new ActivationAdjustmentCodeLengthRule(86400),
    ],
  );
}
