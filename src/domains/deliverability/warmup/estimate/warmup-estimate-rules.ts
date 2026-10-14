import { WarmupEstimate } from "./warmup-estimate.js";

/** A rule a warmup estimate must pass. Check returns its problems, or none. */
export interface WarmupEstimateRule {
  check(item: WarmupEstimate): string[];
}

export class WarmupEstimateRequiredCodeRule implements WarmupEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupEstimateRequiredUtmSourceRule implements WarmupEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupEstimate): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupEstimateCodeLengthRule implements WarmupEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupEstimateRequiredSummaryRule implements WarmupEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupEstimate): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupEstimateCodePrefixRule implements WarmupEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WarmupEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a warmup estimate. */
export class WarmupEstimateValidator {
  rules: WarmupEstimateRule[];

  constructor(rules: WarmupEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupEstimate): string[] {
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

  requireValid(item: WarmupEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupEstimate[]): Map<string, string[]> {
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

export function defaultWarmupEstimateValidator(): WarmupEstimateValidator {
  return new WarmupEstimateValidator(
    [
      new WarmupEstimateRequiredCodeRule("warmup estimate needs this field"),
      new WarmupEstimateRequiredUtmSourceRule("warmup estimate needs a value"),
      new WarmupEstimateCodeLengthRule(86400),
      new WarmupEstimateRequiredSummaryRule("warmup estimate needs a value"),
      new WarmupEstimateCodePrefixRule("Q"),
    ],
  );
}
