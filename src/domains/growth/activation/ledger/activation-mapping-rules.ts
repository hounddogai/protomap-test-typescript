import { ActivationMapping } from "./activation-mapping.js";

/** A rule a activation mapping must pass. Check returns its problems, or none. */
export interface ActivationMappingRule {
  check(item: ActivationMapping): string[];
}

export class ActivationMappingLabelLengthRule implements ActivationMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationMapping): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationMappingRequiredTitleRule implements ActivationMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationMapping): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationMappingRequiredCodeRule implements ActivationMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationMappingReviewerLengthRule implements ActivationMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationMapping): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationMappingPriorityRangeRule implements ActivationMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationMapping): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a activation mapping. */
export class ActivationMappingValidator {
  rules: ActivationMappingRule[];

  constructor(rules: ActivationMappingRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationMapping): string[] {
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

  requireValid(item: ActivationMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationMapping[]): Map<string, string[]> {
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

export function defaultActivationMappingValidator(): ActivationMappingValidator {
  return new ActivationMappingValidator(
    [
      new ActivationMappingLabelLengthRule(80),
      new ActivationMappingRequiredTitleRule("activation mapping needs a value"),
      new ActivationMappingRequiredCodeRule("activation mapping needs an entry"),
      new ActivationMappingReviewerLengthRule(3600),
      new ActivationMappingPriorityRangeRule(80, 80),
    ],
  );
}
