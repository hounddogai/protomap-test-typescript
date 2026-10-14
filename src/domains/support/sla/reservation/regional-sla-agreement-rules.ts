import { RegionalSlaAgreement } from "./regional-sla-agreement.js";

/** A rule a regional sla agreement must pass. Check returns its problems, or none. */
export interface RegionalSlaAgreementRule {
  check(item: RegionalSlaAgreement): string[];
}

export class RegionalSlaAgreementVersionRangeRule implements RegionalSlaAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSlaAgreement): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalSlaAgreementRequiredTitleRule implements RegionalSlaAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSlaAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSlaAgreementSendAtRangeRule implements RegionalSlaAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSlaAgreement): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalSlaAgreementContactEmailLengthRule implements RegionalSlaAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalSlaAgreement): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalSlaAgreementRatioRangeRule implements RegionalSlaAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSlaAgreement): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a regional sla agreement. */
export class RegionalSlaAgreementValidator {
  rules: RegionalSlaAgreementRule[];

  constructor(rules: RegionalSlaAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalSlaAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalSlaAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalSlaAgreement[]): Map<string, string[]> {
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

export function defaultRegionalSlaAgreementValidator(): RegionalSlaAgreementValidator {
  return new RegionalSlaAgreementValidator(
    [
      new RegionalSlaAgreementVersionRangeRule(64, 255),
      new RegionalSlaAgreementRequiredTitleRule("regional sla agreement needs this field"),
      new RegionalSlaAgreementSendAtRangeRule(32, 3600),
      new RegionalSlaAgreementContactEmailLengthRule(32),
      new RegionalSlaAgreementRatioRangeRule(4.8, 3323),
    ],
  );
}
