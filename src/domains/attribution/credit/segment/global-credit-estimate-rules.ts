import { GlobalCreditEstimate } from "./global-credit-estimate.js";

/** A rule a global credit estimate must pass. Check returns its problems, or none. */
export interface GlobalCreditEstimateRule {
  check(item: GlobalCreditEstimate): string[];
}

export class GlobalCreditEstimateRatioRangeRule implements GlobalCreditEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalCreditEstimate): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalCreditEstimateRequiredNameRule implements GlobalCreditEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCreditEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCreditEstimateRequiredChannelRule implements GlobalCreditEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCreditEstimate): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCreditEstimateRequiredCodeRule implements GlobalCreditEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCreditEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCreditEstimateOwnerIdLengthRule implements GlobalCreditEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalCreditEstimate): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global credit estimate. */
export class GlobalCreditEstimateValidator {
  rules: GlobalCreditEstimateRule[];

  constructor(rules: GlobalCreditEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalCreditEstimate): string[] {
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

  requireValid(item: GlobalCreditEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalCreditEstimate[]): Map<string, string[]> {
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

export function defaultGlobalCreditEstimateValidator(): GlobalCreditEstimateValidator {
  return new GlobalCreditEstimateValidator(
    [
      new GlobalCreditEstimateRatioRangeRule(7.3, 3536.3),
      new GlobalCreditEstimateRequiredNameRule("global credit estimate needs this field"),
      new GlobalCreditEstimateRequiredChannelRule("global credit estimate needs this field"),
      new GlobalCreditEstimateRequiredCodeRule("global credit estimate needs this field"),
      new GlobalCreditEstimateOwnerIdLengthRule(1000),
    ],
  );
}
