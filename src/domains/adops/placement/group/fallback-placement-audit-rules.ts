import { FallbackPlacementAudit } from "./fallback-placement-audit.js";

/** A rule a fallback placement audit must pass. Check returns its problems, or none. */
export interface FallbackPlacementAuditRule {
  check(item: FallbackPlacementAudit): string[];
}

export class FallbackPlacementAuditRequiredJourneyIdRule implements FallbackPlacementAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPlacementAudit): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPlacementAuditLabelLengthRule implements FallbackPlacementAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPlacementAudit): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackPlacementAuditRequiredLabelRule implements FallbackPlacementAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPlacementAudit): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPlacementAuditRequiredCodeRule implements FallbackPlacementAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPlacementAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPlacementAuditCodeLengthRule implements FallbackPlacementAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPlacementAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback placement audit. */
export class FallbackPlacementAuditValidator {
  rules: FallbackPlacementAuditRule[];

  constructor(rules: FallbackPlacementAuditRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPlacementAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackPlacementAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPlacementAudit[]): Map<string, string[]> {
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

export function defaultFallbackPlacementAuditValidator(): FallbackPlacementAuditValidator {
  return new FallbackPlacementAuditValidator(
    [
      new FallbackPlacementAuditRequiredJourneyIdRule("fallback placement audit needs a value"),
      new FallbackPlacementAuditLabelLengthRule(255),
      new FallbackPlacementAuditRequiredLabelRule("fallback placement audit needs an entry"),
      new FallbackPlacementAuditRequiredCodeRule("fallback placement audit needs a value"),
      new FallbackPlacementAuditCodeLengthRule(80),
    ],
  );
}
