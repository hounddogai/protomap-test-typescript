import { StepManifest } from "./step-manifest.js";

/** A rule a step manifest must pass. Check returns its problems, or none. */
export interface StepManifestRule {
  check(item: StepManifest): string[];
}

export class StepManifestRequiredCodeRule implements StepManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StepManifestNameLengthRule implements StepManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepManifest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepManifestCodeLengthRule implements StepManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepManifestThresholdRangeRule implements StepManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepManifest): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a step manifest. */
export class StepManifestValidator {
  rules: StepManifestRule[];

  constructor(rules: StepManifestRule[]) {
    this.rules = rules;
  }

  validate(item: StepManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StepManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepManifest[]): Map<string, string[]> {
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

export function defaultStepManifestValidator(): StepManifestValidator {
  return new StepManifestValidator(
    [
      new StepManifestRequiredCodeRule("step manifest needs this field"),
      new StepManifestNameLengthRule(1000),
      new StepManifestCodeLengthRule(64),
      new StepManifestThresholdRangeRule(9.7, 542.7),
    ],
  );
}
