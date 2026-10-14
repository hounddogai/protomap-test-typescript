import { FallbackMacroOverride } from "./fallback-macro-override.js";

/** A rule a fallback macro override must pass. Check returns its problems, or none. */
export interface FallbackMacroOverrideRule {
  check(item: FallbackMacroOverride): string[];
}

export class FallbackMacroOverrideCodeLengthRule implements FallbackMacroOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackMacroOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackMacroOverrideUtmSourceLengthRule implements FallbackMacroOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackMacroOverride): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackMacroOverrideCodePrefixRule implements FallbackMacroOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackMacroOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackMacroOverrideRequiredTitleRule implements FallbackMacroOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackMacroOverride): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackMacroOverrideBatchSizeRangeRule implements FallbackMacroOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackMacroOverride): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a fallback macro override. */
export class FallbackMacroOverrideValidator {
  rules: FallbackMacroOverrideRule[];

  constructor(rules: FallbackMacroOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackMacroOverride): string[] {
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

  requireValid(item: FallbackMacroOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackMacroOverride[]): Map<string, string[]> {
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

export function defaultFallbackMacroOverrideValidator(): FallbackMacroOverrideValidator {
  return new FallbackMacroOverrideValidator(
    [
      new FallbackMacroOverrideCodeLengthRule(1000),
      new FallbackMacroOverrideUtmSourceLengthRule(16),
      new FallbackMacroOverrideCodePrefixRule("OPS"),
      new FallbackMacroOverrideRequiredTitleRule("fallback macro override needs this field"),
      new FallbackMacroOverrideBatchSizeRangeRule(16, 255),
    ],
  );
}
