import { ManualTouchpointBundle } from "./manual-touchpoint-bundle.js";

/** A rule a manual touchpoint bundle must pass. Check returns its problems, or none. */
export interface ManualTouchpointBundleRule {
  check(item: ManualTouchpointBundle): string[];
}

export class ManualTouchpointBundleWeightRangeRule implements ManualTouchpointBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTouchpointBundle): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualTouchpointBundleRequiredLabelRule implements ManualTouchpointBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTouchpointBundle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTouchpointBundleVisibleGuardRule implements ManualTouchpointBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ManualTouchpointBundle): string[] {
    if (item.visible && item.sendAt > this.limit) return [`send at ${item.sendAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class ManualTouchpointBundleBudgetRangeRule implements ManualTouchpointBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTouchpointBundle): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualTouchpointBundleCodePrefixRule implements ManualTouchpointBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualTouchpointBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualTouchpointBundleSendAtRangeRule implements ManualTouchpointBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTouchpointBundle): string[] {
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

/** Runs every rule of a manual touchpoint bundle. */
export class ManualTouchpointBundleValidator {
  rules: ManualTouchpointBundleRule[];

  constructor(rules: ManualTouchpointBundleRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTouchpointBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualTouchpointBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTouchpointBundle[]): Map<string, string[]> {
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

export function defaultManualTouchpointBundleValidator(): ManualTouchpointBundleValidator {
  return new ManualTouchpointBundleValidator(
    [
      new ManualTouchpointBundleWeightRangeRule(6.8, 4985.6),
      new ManualTouchpointBundleRequiredLabelRule("manual touchpoint bundle needs a value"),
      new ManualTouchpointBundleVisibleGuardRule(32),
      new ManualTouchpointBundleBudgetRangeRule(1.2, 952.4),
      new ManualTouchpointBundleCodePrefixRule("REF"),
      new ManualTouchpointBundleSendAtRangeRule(16, 255),
    ],
  );
}
