import { StrictBounceCycle } from "./strict-bounce-cycle.js";

/** A rule a strict bounce cycle must pass. Check returns its problems, or none. */
export interface StrictBounceCycleRule {
  check(item: StrictBounceCycle): string[];
}

export class StrictBounceCycleUtmSourceLengthRule implements StrictBounceCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictBounceCycle): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictBounceCycleRequiredCodeRule implements StrictBounceCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBounceCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictBounceCycleExternalRefLengthRule implements StrictBounceCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictBounceCycle): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictBounceCycleRequiredExternalRefRule implements StrictBounceCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBounceCycle): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class StrictBounceCycleRequiredUtmSourceRule implements StrictBounceCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBounceCycle): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict bounce cycle. */
export class StrictBounceCycleValidator {
  rules: StrictBounceCycleRule[];

  constructor(rules: StrictBounceCycleRule[]) {
    this.rules = rules;
  }

  validate(item: StrictBounceCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictBounceCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictBounceCycle[]): Map<string, string[]> {
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

export function defaultStrictBounceCycleValidator(): StrictBounceCycleValidator {
  return new StrictBounceCycleValidator(
    [
      new StrictBounceCycleUtmSourceLengthRule(3600),
      new StrictBounceCycleRequiredCodeRule("strict bounce cycle needs this field"),
      new StrictBounceCycleExternalRefLengthRule(16),
      new StrictBounceCycleRequiredExternalRefRule("strict bounce cycle needs this field"),
      new StrictBounceCycleRequiredUtmSourceRule("strict bounce cycle needs this field"),
    ],
  );
}
