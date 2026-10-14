import { ProofTemplate } from "./proof-template.js";

/** A rule a proof template must pass. Check returns its problems, or none. */
export interface ProofTemplateRule {
  check(item: ProofTemplate): string[];
}

export class ProofTemplateDurationMinutesRangeRule implements ProofTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofTemplate): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ProofTemplateCodePrefixRule implements ProofTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ProofTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ProofTemplateJourneyIdLengthRule implements ProofTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofTemplate): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a proof template. */
export class ProofTemplateValidator {
  rules: ProofTemplateRule[];

  constructor(rules: ProofTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: ProofTemplate): string[] {
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

  requireValid(item: ProofTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofTemplate[]): Map<string, string[]> {
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

export function defaultProofTemplateValidator(): ProofTemplateValidator {
  return new ProofTemplateValidator(
    [
      new ProofTemplateDurationMinutesRangeRule(64, 120),
      new ProofTemplateCodePrefixRule("Q"),
      new ProofTemplateJourneyIdLengthRule(80),
    ],
  );
}
