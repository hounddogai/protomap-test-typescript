import { FallbackInsightAdjustment } from "./fallback-insight-adjustment.js";

/** A rule a fallback insight adjustment must pass. Check returns its problems, or none. */
export interface FallbackInsightAdjustmentRule {
  check(item: FallbackInsightAdjustment): string[];
}

export class FallbackInsightAdjustmentCodePrefixRule implements FallbackInsightAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackInsightAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackInsightAdjustmentRequiredNameRule implements FallbackInsightAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackInsightAdjustment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackInsightAdjustmentCodeLengthRule implements FallbackInsightAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackInsightAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback insight adjustment. */
export class FallbackInsightAdjustmentValidator {
  rules: FallbackInsightAdjustmentRule[];

  constructor(rules: FallbackInsightAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackInsightAdjustment): string[] {
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

  requireValid(item: FallbackInsightAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackInsightAdjustment[]): Map<string, string[]> {
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

export function defaultFallbackInsightAdjustmentValidator(): FallbackInsightAdjustmentValidator {
  return new FallbackInsightAdjustmentValidator(
    [
      new FallbackInsightAdjustmentCodePrefixRule("OPS"),
      new FallbackInsightAdjustmentRequiredNameRule("fallback insight adjustment needs an entry"),
      new FallbackInsightAdjustmentCodeLengthRule(80),
    ],
  );
}
