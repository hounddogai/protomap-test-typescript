import { GlobalComplaintVariance } from "./global-complaint-variance.js";

/** A rule a global complaint variance must pass. Check returns its problems, or none. */
export interface GlobalComplaintVarianceRule {
  check(item: GlobalComplaintVariance): string[];
}

export class GlobalComplaintVarianceRequiredChannelRule implements GlobalComplaintVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalComplaintVariance): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalComplaintVarianceRatioRangeRule implements GlobalComplaintVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalComplaintVariance): string[] {
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

export class GlobalComplaintVarianceChannelLengthRule implements GlobalComplaintVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalComplaintVariance): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global complaint variance. */
export class GlobalComplaintVarianceValidator {
  rules: GlobalComplaintVarianceRule[];

  constructor(rules: GlobalComplaintVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalComplaintVariance): string[] {
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

  requireValid(item: GlobalComplaintVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalComplaintVariance[]): Map<string, string[]> {
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

export function defaultGlobalComplaintVarianceValidator(): GlobalComplaintVarianceValidator {
  return new GlobalComplaintVarianceValidator(
    [
      new GlobalComplaintVarianceRequiredChannelRule("global complaint variance needs a value"),
      new GlobalComplaintVarianceRatioRangeRule(9.9, 4813.1),
      new GlobalComplaintVarianceChannelLengthRule(255),
    ],
  );
}
