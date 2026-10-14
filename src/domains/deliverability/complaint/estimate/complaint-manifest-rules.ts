import { ComplaintManifest } from "./complaint-manifest.js";

/** A rule a complaint manifest must pass. Check returns its problems, or none. */
export interface ComplaintManifestRule {
  check(item: ComplaintManifest): string[];
}

export class ComplaintManifestRequiredNameRule implements ComplaintManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintManifest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintManifestBudgetRangeRule implements ComplaintManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintManifest): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ComplaintManifestCodeLengthRule implements ComplaintManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a complaint manifest. */
export class ComplaintManifestValidator {
  rules: ComplaintManifestRule[];

  constructor(rules: ComplaintManifestRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ComplaintManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintManifest[]): Map<string, string[]> {
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

export function defaultComplaintManifestValidator(): ComplaintManifestValidator {
  return new ComplaintManifestValidator(
    [
      new ComplaintManifestRequiredNameRule("complaint manifest needs a value"),
      new ComplaintManifestBudgetRangeRule(6.4, 4138),
      new ComplaintManifestCodeLengthRule(3600),
    ],
  );
}
