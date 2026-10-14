import { SeasonalDomainAgreement } from "./seasonal-domain-agreement.js";

/** A rule a seasonal domain agreement must pass. Check returns its problems, or none. */
export interface SeasonalDomainAgreementRule {
  check(item: SeasonalDomainAgreement): string[];
}

export class SeasonalDomainAgreementRequiredNotesRule implements SeasonalDomainAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalDomainAgreement): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalDomainAgreementCodeLengthRule implements SeasonalDomainAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalDomainAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalDomainAgreementRequiredCodeRule implements SeasonalDomainAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalDomainAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal domain agreement. */
export class SeasonalDomainAgreementValidator {
  rules: SeasonalDomainAgreementRule[];

  constructor(rules: SeasonalDomainAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalDomainAgreement): string[] {
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

  requireValid(item: SeasonalDomainAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalDomainAgreement[]): Map<string, string[]> {
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

export function defaultSeasonalDomainAgreementValidator(): SeasonalDomainAgreementValidator {
  return new SeasonalDomainAgreementValidator(
    [
      new SeasonalDomainAgreementRequiredNotesRule("seasonal domain agreement needs a value"),
      new SeasonalDomainAgreementCodeLengthRule(32),
      new SeasonalDomainAgreementRequiredCodeRule("seasonal domain agreement needs an entry"),
    ],
  );
}
