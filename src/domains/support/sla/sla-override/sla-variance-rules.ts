import { SlaVariance } from "./sla-variance.js";

/** A rule a sla variance must pass. Check returns its problems, or none. */
export interface SlaVarianceRule {
  check(item: SlaVariance): string[];
}

export class SlaVarianceQuantityRangeRule implements SlaVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaVariance): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SlaVarianceCodeLengthRule implements SlaVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaVarianceRequiredContactEmailRule implements SlaVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaVariance): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class SlaVarianceCodePrefixRule implements SlaVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SlaVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SlaVarianceTitleLengthRule implements SlaVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaVariance): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sla variance. */
export class SlaVarianceValidator {
  rules: SlaVarianceRule[];

  constructor(rules: SlaVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: SlaVariance): string[] {
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

  requireValid(item: SlaVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaVariance[]): Map<string, string[]> {
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

export function defaultSlaVarianceValidator(): SlaVarianceValidator {
  return new SlaVarianceValidator(
    [
      new SlaVarianceQuantityRangeRule(32, 3600),
      new SlaVarianceCodeLengthRule(1000),
      new SlaVarianceRequiredContactEmailRule("sla variance needs an entry"),
      new SlaVarianceCodePrefixRule("REF"),
      new SlaVarianceTitleLengthRule(86400),
    ],
  );
}
