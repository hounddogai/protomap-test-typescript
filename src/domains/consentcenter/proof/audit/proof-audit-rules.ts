import { ProofAudit } from "./proof-audit.js";

/** A rule a proof audit must pass. Check returns its problems, or none. */
export interface ProofAuditRule {
  check(item: ProofAudit): string[];
}

export class ProofAuditJourneyIdLengthRule implements ProofAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofAudit): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofAuditVersionRangeRule implements ProofAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofAudit): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ProofAuditMinimumRangeRule implements ProofAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofAudit): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ProofAuditCodeLengthRule implements ProofAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofAuditRequiredJourneyIdRule implements ProofAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofAudit): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class ProofAuditVisibleGuardRule implements ProofAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ProofAudit): string[] {
    if (item.visible && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a proof audit. */
export class ProofAuditValidator {
  rules: ProofAuditRule[];

  constructor(rules: ProofAuditRule[]) {
    this.rules = rules;
  }

  validate(item: ProofAudit): string[] {
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

  requireValid(item: ProofAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofAudit[]): Map<string, string[]> {
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

export function defaultProofAuditValidator(): ProofAuditValidator {
  return new ProofAuditValidator(
    [
      new ProofAuditJourneyIdLengthRule(80),
      new ProofAuditVersionRangeRule(16, 80),
      new ProofAuditMinimumRangeRule(6.6, 1194.1),
      new ProofAuditCodeLengthRule(32),
      new ProofAuditRequiredJourneyIdRule("proof audit needs an entry"),
      new ProofAuditVisibleGuardRule(3.5),
    ],
  );
}
