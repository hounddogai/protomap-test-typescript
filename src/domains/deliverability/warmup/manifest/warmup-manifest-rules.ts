import { WarmupManifest } from "./warmup-manifest.js";

/** A rule a warmup manifest must pass. Check returns its problems, or none. */
export interface WarmupManifestRule {
  check(item: WarmupManifest): string[];
}

export class WarmupManifestAmountRangeRule implements WarmupManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupManifest): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WarmupManifestCurrencyLengthRule implements WarmupManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupManifest): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupManifestRequiredCurrencyRule implements WarmupManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupManifest): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupManifestCodePrefixRule implements WarmupManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WarmupManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a warmup manifest. */
export class WarmupManifestValidator {
  rules: WarmupManifestRule[];

  constructor(rules: WarmupManifestRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupManifest[]): Map<string, string[]> {
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

export function defaultWarmupManifestValidator(): WarmupManifestValidator {
  return new WarmupManifestValidator(
    [
      new WarmupManifestAmountRangeRule(3.3, 1833.7),
      new WarmupManifestCurrencyLengthRule(1000),
      new WarmupManifestRequiredCurrencyRule("warmup manifest needs this field"),
      new WarmupManifestCodePrefixRule("REF"),
    ],
  );
}
