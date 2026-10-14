import { DefaultPacingAgreement } from "./default-pacing-agreement.js";

/** A rule a default pacing agreement must pass. Check returns its problems, or none. */
export interface DefaultPacingAgreementRule {
  check(item: DefaultPacingAgreement): string[];
}

export class DefaultPacingAgreementFrequencyCapRangeRule implements DefaultPacingAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPacingAgreement): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultPacingAgreementLabelLengthRule implements DefaultPacingAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPacingAgreement): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPacingAgreementRequiredLabelRule implements DefaultPacingAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPacingAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPacingAgreementLimitRangeRule implements DefaultPacingAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPacingAgreement): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultPacingAgreementCodeLengthRule implements DefaultPacingAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPacingAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default pacing agreement. */
export class DefaultPacingAgreementValidator {
  rules: DefaultPacingAgreementRule[];

  constructor(rules: DefaultPacingAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPacingAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultPacingAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPacingAgreement[]): Map<string, string[]> {
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

export function defaultDefaultPacingAgreementValidator(): DefaultPacingAgreementValidator {
  return new DefaultPacingAgreementValidator(
    [
      new DefaultPacingAgreementFrequencyCapRangeRule(32, 64),
      new DefaultPacingAgreementLabelLengthRule(3600),
      new DefaultPacingAgreementRequiredLabelRule("default pacing agreement needs a value"),
      new DefaultPacingAgreementLimitRangeRule(80, 255),
      new DefaultPacingAgreementCodeLengthRule(32),
    ],
  );
}
