import { WeightedConversionAudit } from "./weighted-conversion-audit.js";

/** A rule a weighted conversion audit must pass. Check returns its problems, or none. */
export interface WeightedConversionAuditRule {
  check(item: WeightedConversionAudit): string[];
}

export class WeightedConversionAuditNameLengthRule implements WeightedConversionAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedConversionAudit): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedConversionAuditRequiredUnitRule implements WeightedConversionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedConversionAudit): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedConversionAuditUnitLengthRule implements WeightedConversionAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedConversionAudit): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedConversionAuditCodeLengthRule implements WeightedConversionAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedConversionAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted conversion audit. */
export class WeightedConversionAuditValidator {
  rules: WeightedConversionAuditRule[];

  constructor(rules: WeightedConversionAuditRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedConversionAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedConversionAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedConversionAudit[]): Map<string, string[]> {
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

export function defaultWeightedConversionAuditValidator(): WeightedConversionAuditValidator {
  return new WeightedConversionAuditValidator(
    [
      new WeightedConversionAuditNameLengthRule(120),
      new WeightedConversionAuditRequiredUnitRule("weighted conversion audit needs this field"),
      new WeightedConversionAuditUnitLengthRule(80),
      new WeightedConversionAuditCodeLengthRule(64),
    ],
  );
}
