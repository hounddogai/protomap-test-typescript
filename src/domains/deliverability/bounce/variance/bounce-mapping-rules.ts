import { BounceMapping } from "./bounce-mapping.js";

/** A rule a bounce mapping must pass. Check returns its problems, or none. */
export interface BounceMappingRule {
  check(item: BounceMapping): string[];
}

export class BounceMappingRequiredNameRule implements BounceMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceMapping): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BounceMappingNameLengthRule implements BounceMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceMapping): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceMappingRatioRangeRule implements BounceMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceMapping): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a bounce mapping. */
export class BounceMappingValidator {
  rules: BounceMappingRule[];

  constructor(rules: BounceMappingRule[]) {
    this.rules = rules;
  }

  validate(item: BounceMapping): string[] {
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

  requireValid(item: BounceMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceMapping[]): Map<string, string[]> {
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

export function defaultBounceMappingValidator(): BounceMappingValidator {
  return new BounceMappingValidator(
    [
      new BounceMappingRequiredNameRule("bounce mapping needs an entry"),
      new BounceMappingNameLengthRule(16),
      new BounceMappingRatioRangeRule(7.6, 4852.2),
    ],
  );
}
