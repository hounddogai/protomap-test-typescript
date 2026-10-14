import { RollingNudgeEstimate } from "./rolling-nudge-estimate.js";

/** A rule a rolling nudge estimate must pass. Check returns its problems, or none. */
export interface RollingNudgeEstimateRule {
  check(item: RollingNudgeEstimate): string[];
}

export class RollingNudgeEstimateCodeLengthRule implements RollingNudgeEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingNudgeEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingNudgeEstimatePhoneLengthRule implements RollingNudgeEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingNudgeEstimate): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingNudgeEstimateLabelLengthRule implements RollingNudgeEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingNudgeEstimate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingNudgeEstimateCodePrefixRule implements RollingNudgeEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingNudgeEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a rolling nudge estimate. */
export class RollingNudgeEstimateValidator {
  rules: RollingNudgeEstimateRule[];

  constructor(rules: RollingNudgeEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: RollingNudgeEstimate): string[] {
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

  requireValid(item: RollingNudgeEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingNudgeEstimate[]): Map<string, string[]> {
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

export function defaultRollingNudgeEstimateValidator(): RollingNudgeEstimateValidator {
  return new RollingNudgeEstimateValidator(
    [
      new RollingNudgeEstimateCodeLengthRule(120),
      new RollingNudgeEstimatePhoneLengthRule(64),
      new RollingNudgeEstimateLabelLengthRule(86400),
      new RollingNudgeEstimateCodePrefixRule("OPS"),
    ],
  );
}
