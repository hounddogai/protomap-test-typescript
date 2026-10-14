import { StepRollup } from "./step-rollup.js";

/** A rule a step rollup must pass. Check returns its problems, or none. */
export interface StepRollupRule {
  check(item: StepRollup): string[];
}

export class StepRollupVariantLengthRule implements StepRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepRollup): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepRollupScoreRangeRule implements StepRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepRollup): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StepRollupCodePrefixRule implements StepRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StepRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StepRollupCodeLengthRule implements StepRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepRollupMaximumRangeRule implements StepRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepRollup): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StepRollupRequiredNameRule implements StepRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepRollup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a step rollup. */
export class StepRollupValidator {
  rules: StepRollupRule[];

  constructor(rules: StepRollupRule[]) {
    this.rules = rules;
  }

  validate(item: StepRollup): string[] {
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

  requireValid(item: StepRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepRollup[]): Map<string, string[]> {
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

export function defaultStepRollupValidator(): StepRollupValidator {
  return new StepRollupValidator(
    [
      new StepRollupVariantLengthRule(80),
      new StepRollupScoreRangeRule(3, 3092.2),
      new StepRollupCodePrefixRule("X"),
      new StepRollupCodeLengthRule(64),
      new StepRollupMaximumRangeRule(7.6, 400.8),
      new StepRollupRequiredNameRule("step rollup needs a value"),
    ],
  );
}
