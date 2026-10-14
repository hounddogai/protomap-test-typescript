import { ConversionGroup } from "./conversion-group.js";

/** A rule a conversion group must pass. Check returns its problems, or none. */
export interface ConversionGroupRule {
  check(item: ConversionGroup): string[];
}

export class ConversionGroupLabelLengthRule implements ConversionGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionGroup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionGroupVisibleGuardRule implements ConversionGroupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ConversionGroup): string[] {
    if (item.visible && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class ConversionGroupCodeLengthRule implements ConversionGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a conversion group. */
export class ConversionGroupValidator {
  rules: ConversionGroupRule[];

  constructor(rules: ConversionGroupRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionGroup): string[] {
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

  requireValid(item: ConversionGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionGroup[]): Map<string, string[]> {
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

export function defaultConversionGroupValidator(): ConversionGroupValidator {
  return new ConversionGroupValidator(
    [
      new ConversionGroupLabelLengthRule(86400),
      new ConversionGroupVisibleGuardRule(2.3),
      new ConversionGroupCodeLengthRule(1000),
    ],
  );
}
