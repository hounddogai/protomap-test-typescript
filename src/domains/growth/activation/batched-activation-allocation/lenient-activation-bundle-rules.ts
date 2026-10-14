import { LenientActivationBundle } from "./lenient-activation-bundle.js";

/** A rule a lenient activation bundle must pass. Check returns its problems, or none. */
export interface LenientActivationBundleRule {
  check(item: LenientActivationBundle): string[];
}

export class LenientActivationBundleRequiredLabelRule implements LenientActivationBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientActivationBundle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientActivationBundleCapacityRangeRule implements LenientActivationBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientActivationBundle): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientActivationBundleSendAtRangeRule implements LenientActivationBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientActivationBundle): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a lenient activation bundle. */
export class LenientActivationBundleValidator {
  rules: LenientActivationBundleRule[];

  constructor(rules: LenientActivationBundleRule[]) {
    this.rules = rules;
  }

  validate(item: LenientActivationBundle): string[] {
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

  requireValid(item: LenientActivationBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientActivationBundle[]): Map<string, string[]> {
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

export function defaultLenientActivationBundleValidator(): LenientActivationBundleValidator {
  return new LenientActivationBundleValidator(
    [
      new LenientActivationBundleRequiredLabelRule("lenient activation bundle needs this field"),
      new LenientActivationBundleCapacityRangeRule(64, 255),
      new LenientActivationBundleSendAtRangeRule(255, 255),
    ],
  );
}
