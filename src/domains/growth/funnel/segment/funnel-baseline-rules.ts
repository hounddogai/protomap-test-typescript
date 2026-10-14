import { FunnelBaseline } from "./funnel-baseline.js";

/** A rule a funnel baseline must pass. Check returns its problems, or none. */
export interface FunnelBaselineRule {
  check(item: FunnelBaseline): string[];
}

export class FunnelBaselineCodeLengthRule implements FunnelBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelBaselineRequiredChannelRule implements FunnelBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelBaseline): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelBaselineRequiredCodeRule implements FunnelBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelBaselineSequenceRangeRule implements FunnelBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelBaseline): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FunnelBaselineCodePrefixRule implements FunnelBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FunnelBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FunnelBaselineRequiredLocaleRule implements FunnelBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelBaseline): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a funnel baseline. */
export class FunnelBaselineValidator {
  rules: FunnelBaselineRule[];

  constructor(rules: FunnelBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelBaseline[]): Map<string, string[]> {
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

export function defaultFunnelBaselineValidator(): FunnelBaselineValidator {
  return new FunnelBaselineValidator(
    [
      new FunnelBaselineCodeLengthRule(120),
      new FunnelBaselineRequiredChannelRule("funnel baseline needs an entry"),
      new FunnelBaselineRequiredCodeRule("funnel baseline needs this field"),
      new FunnelBaselineSequenceRangeRule(255, 255),
      new FunnelBaselineCodePrefixRule("Q"),
      new FunnelBaselineRequiredLocaleRule("funnel baseline needs this field"),
    ],
  );
}
