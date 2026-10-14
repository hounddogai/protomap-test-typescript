import { GlobalEscalationBundle } from "./global-escalation-bundle.js";

/** A rule a global escalation bundle must pass. Check returns its problems, or none. */
export interface GlobalEscalationBundleRule {
  check(item: GlobalEscalationBundle): string[];
}

export class GlobalEscalationBundleWeightRangeRule implements GlobalEscalationBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalEscalationBundle): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalEscalationBundleRequiredCodeRule implements GlobalEscalationBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalEscalationBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalEscalationBundleCodeLengthRule implements GlobalEscalationBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalEscalationBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalEscalationBundleRequiredLabelRule implements GlobalEscalationBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalEscalationBundle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalEscalationBundleThresholdRangeRule implements GlobalEscalationBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalEscalationBundle): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalEscalationBundleChecksumLengthRule implements GlobalEscalationBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalEscalationBundle): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global escalation bundle. */
export class GlobalEscalationBundleValidator {
  rules: GlobalEscalationBundleRule[];

  constructor(rules: GlobalEscalationBundleRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalEscalationBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalEscalationBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalEscalationBundle[]): Map<string, string[]> {
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

export function defaultGlobalEscalationBundleValidator(): GlobalEscalationBundleValidator {
  return new GlobalEscalationBundleValidator(
    [
      new GlobalEscalationBundleWeightRangeRule(7.9, 3600.5),
      new GlobalEscalationBundleRequiredCodeRule("global escalation bundle needs an entry"),
      new GlobalEscalationBundleCodeLengthRule(120),
      new GlobalEscalationBundleRequiredLabelRule("global escalation bundle needs an entry"),
      new GlobalEscalationBundleThresholdRangeRule(6, 3022.6),
      new GlobalEscalationBundleChecksumLengthRule(32),
    ],
  );
}
