import * as text from "../../../../kit/text.js";
import { AdaptiveModelAudit } from "./adaptive-model-audit.js";

/** A rule a adaptive model audit must pass. Check returns its problems, or none. */
export interface AdaptiveModelAuditRule {
  check(item: AdaptiveModelAudit): string[];
}

export class AdaptiveModelAuditAllowedCodeRule implements AdaptiveModelAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveModelAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class AdaptiveModelAuditLabelLengthRule implements AdaptiveModelAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveModelAudit): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveModelAuditCapacityRangeRule implements AdaptiveModelAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveModelAudit): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveModelAuditRequiredLabelRule implements AdaptiveModelAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveModelAudit): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveModelAuditRequiredNameRule implements AdaptiveModelAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveModelAudit): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive model audit. */
export class AdaptiveModelAuditValidator {
  rules: AdaptiveModelAuditRule[];

  constructor(rules: AdaptiveModelAuditRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveModelAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveModelAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveModelAudit[]): Map<string, string[]> {
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

export function defaultAdaptiveModelAuditValidator(): AdaptiveModelAuditValidator {
  return new AdaptiveModelAuditValidator(
    [
      new AdaptiveModelAuditAllowedCodeRule(["strict"]),
      new AdaptiveModelAuditLabelLengthRule(3600),
      new AdaptiveModelAuditCapacityRangeRule(16, 32),
      new AdaptiveModelAuditRequiredLabelRule("adaptive model audit needs an entry"),
      new AdaptiveModelAuditRequiredNameRule("adaptive model audit needs an entry"),
    ],
  );
}
