import { GlobalCreativePlan } from "./global-creative-plan.js";

/** A rule a global creative plan must pass. Check returns its problems, or none. */
export interface GlobalCreativePlanRule {
  check(item: GlobalCreativePlan): string[];
}

export class GlobalCreativePlanCodeLengthRule implements GlobalCreativePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalCreativePlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalCreativePlanChecksumLengthRule implements GlobalCreativePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalCreativePlan): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalCreativePlanRequiredLabelRule implements GlobalCreativePlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCreativePlan): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCreativePlanLabelLengthRule implements GlobalCreativePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalCreativePlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global creative plan. */
export class GlobalCreativePlanValidator {
  rules: GlobalCreativePlanRule[];

  constructor(rules: GlobalCreativePlanRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalCreativePlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalCreativePlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalCreativePlan[]): Map<string, string[]> {
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

export function defaultGlobalCreativePlanValidator(): GlobalCreativePlanValidator {
  return new GlobalCreativePlanValidator(
    [
      new GlobalCreativePlanCodeLengthRule(80),
      new GlobalCreativePlanChecksumLengthRule(1000),
      new GlobalCreativePlanRequiredLabelRule("global creative plan needs this field"),
      new GlobalCreativePlanLabelLengthRule(32),
    ],
  );
}
