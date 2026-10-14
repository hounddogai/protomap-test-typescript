import { ManualBounceThreshold } from "./manual-bounce-threshold.js";

/** A rule a manual bounce threshold must pass. Check returns its problems, or none. */
export interface ManualBounceThresholdRule {
  check(item: ManualBounceThreshold): string[];
}

export class ManualBounceThresholdConversionRateRangeRule implements ManualBounceThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualBounceThreshold): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualBounceThresholdExternalRefLengthRule implements ManualBounceThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBounceThreshold): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBounceThresholdRequiredNameRule implements ManualBounceThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBounceThreshold): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualBounceThresholdRequiredCodeRule implements ManualBounceThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBounceThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualBounceThresholdCodeLengthRule implements ManualBounceThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBounceThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBounceThresholdCodePrefixRule implements ManualBounceThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualBounceThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a manual bounce threshold. */
export class ManualBounceThresholdValidator {
  rules: ManualBounceThresholdRule[];

  constructor(rules: ManualBounceThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: ManualBounceThreshold): string[] {
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

  requireValid(item: ManualBounceThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualBounceThreshold[]): Map<string, string[]> {
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

export function defaultManualBounceThresholdValidator(): ManualBounceThresholdValidator {
  return new ManualBounceThresholdValidator(
    [
      new ManualBounceThresholdConversionRateRangeRule(8.2, 974.7),
      new ManualBounceThresholdExternalRefLengthRule(120),
      new ManualBounceThresholdRequiredNameRule("manual bounce threshold needs a value"),
      new ManualBounceThresholdRequiredCodeRule("manual bounce threshold needs an entry"),
      new ManualBounceThresholdCodeLengthRule(16),
      new ManualBounceThresholdCodePrefixRule("Q"),
    ],
  );
}
