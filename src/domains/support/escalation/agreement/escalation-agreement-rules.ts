import { EscalationAgreement } from "./escalation-agreement.js";

/** A rule a escalation agreement must pass. Check returns its problems, or none. */
export interface EscalationAgreementRule {
  check(item: EscalationAgreement): string[];
}

export class EscalationAgreementCodePrefixRule implements EscalationAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EscalationAgreementRequiredCodeRule implements EscalationAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationAgreementRequiredTitleRule implements EscalationAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a escalation agreement. */
export class EscalationAgreementValidator {
  rules: EscalationAgreementRule[];

  constructor(rules: EscalationAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationAgreement): string[] {
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

  requireValid(item: EscalationAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationAgreement[]): Map<string, string[]> {
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

export function defaultEscalationAgreementValidator(): EscalationAgreementValidator {
  return new EscalationAgreementValidator(
    [
      new EscalationAgreementCodePrefixRule("REF"),
      new EscalationAgreementRequiredCodeRule("escalation agreement needs a value"),
      new EscalationAgreementRequiredTitleRule("escalation agreement needs this field"),
    ],
  );
}
