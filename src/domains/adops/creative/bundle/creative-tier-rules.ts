import { CreativeTier } from "./creative-tier.js";

/** A rule a creative tier must pass. Check returns its problems, or none. */
export interface CreativeTierRule {
  check(item: CreativeTier): string[];
}

export class CreativeTierSendAtRangeRule implements CreativeTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeTier): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreativeTierUnitLengthRule implements CreativeTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeTier): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeTierAmountRangeRule implements CreativeTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeTier): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreativeTierNameLengthRule implements CreativeTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeTier): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a creative tier. */
export class CreativeTierValidator {
  rules: CreativeTierRule[];

  constructor(rules: CreativeTierRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeTier[]): Map<string, string[]> {
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

export function defaultCreativeTierValidator(): CreativeTierValidator {
  return new CreativeTierValidator(
    [
      new CreativeTierSendAtRangeRule(80, 80),
      new CreativeTierUnitLengthRule(64),
      new CreativeTierAmountRangeRule(9.3, 4322.9),
      new CreativeTierNameLengthRule(3600),
    ],
  );
}
