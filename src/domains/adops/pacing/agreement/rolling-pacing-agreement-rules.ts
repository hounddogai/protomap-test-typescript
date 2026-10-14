import * as text from "../../../../kit/text.js";
import { RollingPacingAgreement } from "./rolling-pacing-agreement.js";

/** A rule a rolling pacing agreement must pass. Check returns its problems, or none. */
export interface RollingPacingAgreementRule {
  check(item: RollingPacingAgreement): string[];
}

export class RollingPacingAgreementAllowedCodeRule implements RollingPacingAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingPacingAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class RollingPacingAgreementRequiredCodeRule implements RollingPacingAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPacingAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPacingAgreementUnitLengthRule implements RollingPacingAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPacingAgreement): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling pacing agreement. */
export class RollingPacingAgreementValidator {
  rules: RollingPacingAgreementRule[];

  constructor(rules: RollingPacingAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPacingAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingPacingAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPacingAgreement[]): Map<string, string[]> {
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

export function defaultRollingPacingAgreementValidator(): RollingPacingAgreementValidator {
  return new RollingPacingAgreementValidator(
    [
      new RollingPacingAgreementAllowedCodeRule(["batched"]),
      new RollingPacingAgreementRequiredCodeRule("rolling pacing agreement needs this field"),
      new RollingPacingAgreementUnitLengthRule(3600),
    ],
  );
}
