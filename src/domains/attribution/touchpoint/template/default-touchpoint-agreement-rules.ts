import * as text from "../../../../kit/text.js";
import { DefaultTouchpointAgreement } from "./default-touchpoint-agreement.js";

/** A rule a default touchpoint agreement must pass. Check returns its problems, or none. */
export interface DefaultTouchpointAgreementRule {
  check(item: DefaultTouchpointAgreement): string[];
}

export class DefaultTouchpointAgreementRequiredTitleRule implements DefaultTouchpointAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultTouchpointAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultTouchpointAgreementAllowedCodeRule implements DefaultTouchpointAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultTouchpointAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class DefaultTouchpointAgreementOpenRateRangeRule implements DefaultTouchpointAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultTouchpointAgreement): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default touchpoint agreement. */
export class DefaultTouchpointAgreementValidator {
  rules: DefaultTouchpointAgreementRule[];

  constructor(rules: DefaultTouchpointAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultTouchpointAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultTouchpointAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultTouchpointAgreement[]): Map<string, string[]> {
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

export function defaultDefaultTouchpointAgreementValidator(): DefaultTouchpointAgreementValidator {
  return new DefaultTouchpointAgreementValidator(
    [
      new DefaultTouchpointAgreementRequiredTitleRule("default touchpoint agreement needs a value"),
      new DefaultTouchpointAgreementAllowedCodeRule(["scheduled", "scheduled", "tiered"]),
      new DefaultTouchpointAgreementOpenRateRangeRule(2.5, 2558.6),
    ],
  );
}
