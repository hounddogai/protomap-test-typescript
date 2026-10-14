import { LenientFunnelSegment } from "./lenient-funnel-segment.js";

/** A rule a lenient funnel segment must pass. Check returns its problems, or none. */
export interface LenientFunnelSegmentRule {
  check(item: LenientFunnelSegment): string[];
}

export class LenientFunnelSegmentRequiredCodeRule implements LenientFunnelSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientFunnelSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientFunnelSegmentUpdatedAtRangeRule implements LenientFunnelSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientFunnelSegment): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientFunnelSegmentCodePrefixRule implements LenientFunnelSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientFunnelSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientFunnelSegmentRequiredVariantRule implements LenientFunnelSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientFunnelSegment): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class LenientFunnelSegmentBatchSizeRangeRule implements LenientFunnelSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientFunnelSegment): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientFunnelSegmentRequiredNameRule implements LenientFunnelSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientFunnelSegment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient funnel segment. */
export class LenientFunnelSegmentValidator {
  rules: LenientFunnelSegmentRule[];

  constructor(rules: LenientFunnelSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: LenientFunnelSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientFunnelSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientFunnelSegment[]): Map<string, string[]> {
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

export function defaultLenientFunnelSegmentValidator(): LenientFunnelSegmentValidator {
  return new LenientFunnelSegmentValidator(
    [
      new LenientFunnelSegmentRequiredCodeRule("lenient funnel segment needs this field"),
      new LenientFunnelSegmentUpdatedAtRangeRule(32, 64),
      new LenientFunnelSegmentCodePrefixRule("OPS"),
      new LenientFunnelSegmentRequiredVariantRule("lenient funnel segment needs this field"),
      new LenientFunnelSegmentBatchSizeRangeRule(120, 3600),
      new LenientFunnelSegmentRequiredNameRule("lenient funnel segment needs a value"),
    ],
  );
}
