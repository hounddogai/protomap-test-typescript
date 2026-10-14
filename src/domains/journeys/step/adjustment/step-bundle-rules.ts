import { StepBundle } from "./step-bundle.js";

/** A rule a step bundle must pass. Check returns its problems, or none. */
export interface StepBundleRule {
  check(item: StepBundle): string[];
}

export class StepBundleRequiredTitleRule implements StepBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepBundle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StepBundlePhoneLengthRule implements StepBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepBundle): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepBundleRequiredVariantRule implements StepBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepBundle): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a step bundle. */
export class StepBundleValidator {
  rules: StepBundleRule[];

  constructor(rules: StepBundleRule[]) {
    this.rules = rules;
  }

  validate(item: StepBundle): string[] {
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

  requireValid(item: StepBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepBundle[]): Map<string, string[]> {
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

export function defaultStepBundleValidator(): StepBundleValidator {
  return new StepBundleValidator(
    [
      new StepBundleRequiredTitleRule("step bundle needs a value"),
      new StepBundlePhoneLengthRule(86400),
      new StepBundleRequiredVariantRule("step bundle needs this field"),
    ],
  );
}
