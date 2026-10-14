import { StrictMacroTarget } from "./strict-macro-target.js";

/** A rule a strict macro target must pass. Check returns its problems, or none. */
export interface StrictMacroTargetRule {
  check(item: StrictMacroTarget): string[];
}

export class StrictMacroTargetFrequencyCapRangeRule implements StrictMacroTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictMacroTarget): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictMacroTargetRequiredCodeRule implements StrictMacroTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictMacroTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictMacroTargetBidRangeRule implements StrictMacroTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictMacroTarget): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictMacroTargetNameLengthRule implements StrictMacroTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictMacroTarget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictMacroTargetThresholdRangeRule implements StrictMacroTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictMacroTarget): string[] {
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

/** Runs every rule of a strict macro target. */
export class StrictMacroTargetValidator {
  rules: StrictMacroTargetRule[];

  constructor(rules: StrictMacroTargetRule[]) {
    this.rules = rules;
  }

  validate(item: StrictMacroTarget): string[] {
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

  requireValid(item: StrictMacroTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictMacroTarget[]): Map<string, string[]> {
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

export function defaultStrictMacroTargetValidator(): StrictMacroTargetValidator {
  return new StrictMacroTargetValidator(
    [
      new StrictMacroTargetFrequencyCapRangeRule(16, 80),
      new StrictMacroTargetRequiredCodeRule("strict macro target needs a value"),
      new StrictMacroTargetBidRangeRule(1.7, 1499.5),
      new StrictMacroTargetNameLengthRule(64),
      new StrictMacroTargetThresholdRangeRule(9.6, 326.4),
    ],
  );
}
