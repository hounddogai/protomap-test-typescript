import { StrictStepTarget } from "./strict-step-target.js";

/** A rule a strict step target must pass. Check returns its problems, or none. */
export interface StrictStepTargetRule {
  check(item: StrictStepTarget): string[];
}

export class StrictStepTargetCodePrefixRule implements StrictStepTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictStepTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictStepTargetCapacityRangeRule implements StrictStepTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictStepTarget): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictStepTargetTitleLengthRule implements StrictStepTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictStepTarget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictStepTargetCodeLengthRule implements StrictStepTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictStepTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictStepTargetRequiredCohortRule implements StrictStepTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictStepTarget): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict step target. */
export class StrictStepTargetValidator {
  rules: StrictStepTargetRule[];

  constructor(rules: StrictStepTargetRule[]) {
    this.rules = rules;
  }

  validate(item: StrictStepTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictStepTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictStepTarget[]): Map<string, string[]> {
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

export function defaultStrictStepTargetValidator(): StrictStepTargetValidator {
  return new StrictStepTargetValidator(
    [
      new StrictStepTargetCodePrefixRule("REF"),
      new StrictStepTargetCapacityRangeRule(255, 86400),
      new StrictStepTargetTitleLengthRule(16),
      new StrictStepTargetCodeLengthRule(120),
      new StrictStepTargetRequiredCohortRule("strict step target needs a value"),
    ],
  );
}
