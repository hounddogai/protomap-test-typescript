import { StepAudit } from "./step-audit.js";

/** A rule a step audit must pass. Check returns its problems, or none. */
export interface StepAuditRule {
  check(item: StepAudit): string[];
}

export class StepAuditCodeLengthRule implements StepAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepAuditRequiredCodeRule implements StepAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StepAuditAmountRangeRule implements StepAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepAudit): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StepAuditImpressionsRangeRule implements StepAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepAudit): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StepAuditRequiredSegmentRule implements StepAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepAudit): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a step audit. */
export class StepAuditValidator {
  rules: StepAuditRule[];

  constructor(rules: StepAuditRule[]) {
    this.rules = rules;
  }

  validate(item: StepAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StepAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepAudit[]): Map<string, string[]> {
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

export function defaultStepAuditValidator(): StepAuditValidator {
  return new StepAuditValidator(
    [
      new StepAuditCodeLengthRule(3600),
      new StepAuditRequiredCodeRule("step audit needs a value"),
      new StepAuditAmountRangeRule(8.3, 342.7),
      new StepAuditImpressionsRangeRule(1000, 3600),
      new StepAuditRequiredSegmentRule("step audit needs a value"),
    ],
  );
}
