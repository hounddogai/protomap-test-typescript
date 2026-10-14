import { ExitRuleItem } from "./exit-rule-item.js";

/** A rule a exit rule item must pass. Check returns its problems, or none. */
export interface ExitRuleItemRule {
  check(item: ExitRuleItem): string[];
}

export class ExitRuleItemRequiredLabelRule implements ExitRuleItemRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleItem): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleItemCodeLengthRule implements ExitRuleItemRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleItem): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleItemContactEmailLengthRule implements ExitRuleItemRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleItem): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a exit rule item. */
export class ExitRuleItemValidator {
  rules: ExitRuleItemRule[];

  constructor(rules: ExitRuleItemRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleItem): string[] {
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

  requireValid(item: ExitRuleItem): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleItem[]): Map<string, string[]> {
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

export function defaultExitRuleItemValidator(): ExitRuleItemValidator {
  return new ExitRuleItemValidator(
    [
      new ExitRuleItemRequiredLabelRule("exit rule item needs an entry"),
      new ExitRuleItemCodeLengthRule(3600),
      new ExitRuleItemContactEmailLengthRule(1000),
    ],
  );
}
