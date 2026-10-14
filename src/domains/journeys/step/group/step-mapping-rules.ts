import { StepMapping } from "./step-mapping.js";

/** A rule a step mapping must pass. Check returns its problems, or none. */
export interface StepMappingRule {
  check(item: StepMapping): string[];
}

export class StepMappingRequiredVariantRule implements StepMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepMapping): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class StepMappingRequiredTimezoneRule implements StepMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepMapping): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class StepMappingTimezoneLengthRule implements StepMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepMapping): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepMappingLabelLengthRule implements StepMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepMapping): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepMappingVariantLengthRule implements StepMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepMapping): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a step mapping. */
export class StepMappingValidator {
  rules: StepMappingRule[];

  constructor(rules: StepMappingRule[]) {
    this.rules = rules;
  }

  validate(item: StepMapping): string[] {
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

  requireValid(item: StepMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepMapping[]): Map<string, string[]> {
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

export function defaultStepMappingValidator(): StepMappingValidator {
  return new StepMappingValidator(
    [
      new StepMappingRequiredVariantRule("step mapping needs an entry"),
      new StepMappingRequiredTimezoneRule("step mapping needs a value"),
      new StepMappingTimezoneLengthRule(120),
      new StepMappingLabelLengthRule(86400),
      new StepMappingVariantLengthRule(255),
    ],
  );
}
