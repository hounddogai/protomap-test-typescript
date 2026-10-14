import { ExitRuleAgreement } from "./exit-rule-agreement.js";

/** A rule a exit rule agreement must pass. Check returns its problems, or none. */
export interface ExitRuleAgreementRule {
  check(item: ExitRuleAgreement): string[];
}

export class ExitRuleAgreementMinimumRangeRule implements ExitRuleAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleAgreement): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ExitRuleAgreementRevisionRangeRule implements ExitRuleAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleAgreement): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ExitRuleAgreementLimitRangeRule implements ExitRuleAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleAgreement): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ExitRuleAgreementRequiredTimezoneRule implements ExitRuleAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleAgreement): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleAgreementRequiredDescriptionRule implements ExitRuleAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleAgreement): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a exit rule agreement. */
export class ExitRuleAgreementValidator {
  rules: ExitRuleAgreementRule[];

  constructor(rules: ExitRuleAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleAgreement[]): Map<string, string[]> {
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

export function defaultExitRuleAgreementValidator(): ExitRuleAgreementValidator {
  return new ExitRuleAgreementValidator(
    [
      new ExitRuleAgreementMinimumRangeRule(5.4, 2360.8),
      new ExitRuleAgreementRevisionRangeRule(32, 80),
      new ExitRuleAgreementLimitRangeRule(64, 3600),
      new ExitRuleAgreementRequiredTimezoneRule("exit rule agreement needs a value"),
      new ExitRuleAgreementRequiredDescriptionRule("exit rule agreement needs an entry"),
    ],
  );
}
