import { GlobalCreativeException } from "./global-creative-exception.js";

/** A rule a global creative exception must pass. Check returns its problems, or none. */
export interface GlobalCreativeExceptionRule {
  check(item: GlobalCreativeException): string[];
}

export class GlobalCreativeExceptionVisibleGuardRule implements GlobalCreativeExceptionRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalCreativeException): string[] {
    if (item.visible && item.bid > this.limit) return [`bid ${item.bid} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class GlobalCreativeExceptionRequiredLabelRule implements GlobalCreativeExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCreativeException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCreativeExceptionRequiredCountryRule implements GlobalCreativeExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCreativeException): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCreativeExceptionRequiredNameRule implements GlobalCreativeExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCreativeException): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCreativeExceptionCountryLengthRule implements GlobalCreativeExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalCreativeException): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global creative exception. */
export class GlobalCreativeExceptionValidator {
  rules: GlobalCreativeExceptionRule[];

  constructor(rules: GlobalCreativeExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalCreativeException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalCreativeException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalCreativeException[]): Map<string, string[]> {
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

export function defaultGlobalCreativeExceptionValidator(): GlobalCreativeExceptionValidator {
  return new GlobalCreativeExceptionValidator(
    [
      new GlobalCreativeExceptionVisibleGuardRule(5.9),
      new GlobalCreativeExceptionRequiredLabelRule("global creative exception needs a value"),
      new GlobalCreativeExceptionRequiredCountryRule("global creative exception needs this field"),
      new GlobalCreativeExceptionRequiredNameRule("global creative exception needs this field"),
      new GlobalCreativeExceptionCountryLengthRule(255),
    ],
  );
}
