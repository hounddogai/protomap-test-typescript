import { ManualWaitTarget } from "./manual-wait-target.js";

/** A rule a manual wait target must pass. Check returns its problems, or none. */
export interface ManualWaitTargetRule {
  check(item: ManualWaitTarget): string[];
}

export class ManualWaitTargetRateRangeRule implements ManualWaitTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualWaitTarget): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualWaitTargetRequiredExternalRefRule implements ManualWaitTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualWaitTarget): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class ManualWaitTargetRequiredCodeRule implements ManualWaitTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualWaitTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualWaitTargetNameLengthRule implements ManualWaitTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualWaitTarget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualWaitTargetRequiredNameRule implements ManualWaitTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualWaitTarget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualWaitTargetCodePrefixRule implements ManualWaitTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualWaitTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a manual wait target. */
export class ManualWaitTargetValidator {
  rules: ManualWaitTargetRule[];

  constructor(rules: ManualWaitTargetRule[]) {
    this.rules = rules;
  }

  validate(item: ManualWaitTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualWaitTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualWaitTarget[]): Map<string, string[]> {
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

export function defaultManualWaitTargetValidator(): ManualWaitTargetValidator {
  return new ManualWaitTargetValidator(
    [
      new ManualWaitTargetRateRangeRule(5.9, 1937.9),
      new ManualWaitTargetRequiredExternalRefRule("manual wait target needs a value"),
      new ManualWaitTargetRequiredCodeRule("manual wait target needs this field"),
      new ManualWaitTargetNameLengthRule(255),
      new ManualWaitTargetRequiredNameRule("manual wait target needs a value"),
      new ManualWaitTargetCodePrefixRule("REF"),
    ],
  );
}
