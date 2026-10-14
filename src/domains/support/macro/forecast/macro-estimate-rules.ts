import { MacroEstimate } from "./macro-estimate.js";

/** A rule a macro estimate must pass. Check returns its problems, or none. */
export interface MacroEstimateRule {
  check(item: MacroEstimate): string[];
}

export class MacroEstimateTitleLengthRule implements MacroEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroEstimate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroEstimateRequiredTitleRule implements MacroEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroEstimate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class MacroEstimateThresholdRangeRule implements MacroEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroEstimate): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MacroEstimateRequiredOwnerIdRule implements MacroEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroEstimate): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class MacroEstimateCodePrefixRule implements MacroEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MacroEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a macro estimate. */
export class MacroEstimateValidator {
  rules: MacroEstimateRule[];

  constructor(rules: MacroEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: MacroEstimate): string[] {
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

  requireValid(item: MacroEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroEstimate[]): Map<string, string[]> {
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

export function defaultMacroEstimateValidator(): MacroEstimateValidator {
  return new MacroEstimateValidator(
    [
      new MacroEstimateTitleLengthRule(80),
      new MacroEstimateRequiredTitleRule("macro estimate needs a value"),
      new MacroEstimateThresholdRangeRule(3.1, 2210),
      new MacroEstimateRequiredOwnerIdRule("macro estimate needs a value"),
      new MacroEstimateCodePrefixRule("REF"),
    ],
  );
}
