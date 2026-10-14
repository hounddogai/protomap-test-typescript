import { GlobalDeflectionBaseline } from "./global-deflection-baseline.js";

/** A rule a global deflection baseline must pass. Check returns its problems, or none. */
export interface GlobalDeflectionBaselineRule {
  check(item: GlobalDeflectionBaseline): string[];
}

export class GlobalDeflectionBaselineCodeLengthRule implements GlobalDeflectionBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalDeflectionBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalDeflectionBaselineRequiredDescriptionRule implements GlobalDeflectionBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalDeflectionBaseline): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalDeflectionBaselineLabelLengthRule implements GlobalDeflectionBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalDeflectionBaseline): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalDeflectionBaselineRequiredCodeRule implements GlobalDeflectionBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalDeflectionBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalDeflectionBaselineRequiredLabelRule implements GlobalDeflectionBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalDeflectionBaseline): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalDeflectionBaselineDescriptionLengthRule implements GlobalDeflectionBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalDeflectionBaseline): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global deflection baseline. */
export class GlobalDeflectionBaselineValidator {
  rules: GlobalDeflectionBaselineRule[];

  constructor(rules: GlobalDeflectionBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalDeflectionBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalDeflectionBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalDeflectionBaseline[]): Map<string, string[]> {
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

export function defaultGlobalDeflectionBaselineValidator(): GlobalDeflectionBaselineValidator {
  return new GlobalDeflectionBaselineValidator(
    [
      new GlobalDeflectionBaselineCodeLengthRule(3600),
      new GlobalDeflectionBaselineRequiredDescriptionRule("global deflection baseline needs a value"),
      new GlobalDeflectionBaselineLabelLengthRule(80),
      new GlobalDeflectionBaselineRequiredCodeRule("global deflection baseline needs an entry"),
      new GlobalDeflectionBaselineRequiredLabelRule("global deflection baseline needs a value"),
      new GlobalDeflectionBaselineDescriptionLengthRule(80),
    ],
  );
}
