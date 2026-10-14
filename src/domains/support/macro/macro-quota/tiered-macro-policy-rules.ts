import { TieredMacroPolicy } from "./tiered-macro-policy.js";

/** A rule a tiered macro policy must pass. Check returns its problems, or none. */
export interface TieredMacroPolicyRule {
  check(item: TieredMacroPolicy): string[];
}

export class TieredMacroPolicySendAtRangeRule implements TieredMacroPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredMacroPolicy): string[] {
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

export class TieredMacroPolicyRequiredCodeRule implements TieredMacroPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredMacroPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredMacroPolicyRevisionRangeRule implements TieredMacroPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredMacroPolicy): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredMacroPolicyNameLengthRule implements TieredMacroPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredMacroPolicy): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered macro policy. */
export class TieredMacroPolicyValidator {
  rules: TieredMacroPolicyRule[];

  constructor(rules: TieredMacroPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: TieredMacroPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredMacroPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredMacroPolicy[]): Map<string, string[]> {
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

export function defaultTieredMacroPolicyValidator(): TieredMacroPolicyValidator {
  return new TieredMacroPolicyValidator(
    [
      new TieredMacroPolicySendAtRangeRule(120, 255),
      new TieredMacroPolicyRequiredCodeRule("tiered macro policy needs an entry"),
      new TieredMacroPolicyRevisionRangeRule(32, 255),
      new TieredMacroPolicyNameLengthRule(64),
    ],
  );
}
