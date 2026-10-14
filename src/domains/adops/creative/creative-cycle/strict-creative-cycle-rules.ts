import { StrictCreativeCycle } from "./strict-creative-cycle.js";

/** A rule a strict creative cycle must pass. Check returns its problems, or none. */
export interface StrictCreativeCycleRule {
  check(item: StrictCreativeCycle): string[];
}

export class StrictCreativeCycleRequiredCodeRule implements StrictCreativeCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCreativeCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictCreativeCycleTitleLengthRule implements StrictCreativeCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCreativeCycle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictCreativeCycleCodeLengthRule implements StrictCreativeCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCreativeCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictCreativeCycleRequiredUtmSourceRule implements StrictCreativeCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCreativeCycle): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict creative cycle. */
export class StrictCreativeCycleValidator {
  rules: StrictCreativeCycleRule[];

  constructor(rules: StrictCreativeCycleRule[]) {
    this.rules = rules;
  }

  validate(item: StrictCreativeCycle): string[] {
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

  requireValid(item: StrictCreativeCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictCreativeCycle[]): Map<string, string[]> {
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

export function defaultStrictCreativeCycleValidator(): StrictCreativeCycleValidator {
  return new StrictCreativeCycleValidator(
    [
      new StrictCreativeCycleRequiredCodeRule("strict creative cycle needs an entry"),
      new StrictCreativeCycleTitleLengthRule(255),
      new StrictCreativeCycleCodeLengthRule(80),
      new StrictCreativeCycleRequiredUtmSourceRule("strict creative cycle needs this field"),
    ],
  );
}
