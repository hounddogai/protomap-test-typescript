import { CreativeTarget } from "./creative-target.js";

/** A rule a creative target must pass. Check returns its problems, or none. */
export interface CreativeTargetRule {
  check(item: CreativeTarget): string[];
}

export class CreativeTargetThresholdRangeRule implements CreativeTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeTarget): string[] {
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

export class CreativeTargetUpdatedAtRangeRule implements CreativeTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeTarget): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreativeTargetRequiredSourceRule implements CreativeTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeTarget): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeTargetContactEmailLengthRule implements CreativeTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeTarget): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a creative target. */
export class CreativeTargetValidator {
  rules: CreativeTargetRule[];

  constructor(rules: CreativeTargetRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeTarget): string[] {
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

  requireValid(item: CreativeTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeTarget[]): Map<string, string[]> {
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

export function defaultCreativeTargetValidator(): CreativeTargetValidator {
  return new CreativeTargetValidator(
    [
      new CreativeTargetThresholdRangeRule(5.4, 379),
      new CreativeTargetUpdatedAtRangeRule(64, 255),
      new CreativeTargetRequiredSourceRule("creative target needs an entry"),
      new CreativeTargetContactEmailLengthRule(80),
    ],
  );
}
