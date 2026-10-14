import * as text from "../../../../kit/text.js";
import { MacroAgreement } from "./macro-agreement.js";

/** A rule a macro agreement must pass. Check returns its problems, or none. */
export interface MacroAgreementRule {
  check(item: MacroAgreement): string[];
}

export class MacroAgreementTitleLengthRule implements MacroAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroAgreementAllowedTitleRule implements MacroAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MacroAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is unknown`];
    return [];
  }
}

export class MacroAgreementRequiredTitleRule implements MacroAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class MacroAgreementCodeLengthRule implements MacroAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a macro agreement. */
export class MacroAgreementValidator {
  rules: MacroAgreementRule[];

  constructor(rules: MacroAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: MacroAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MacroAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroAgreement[]): Map<string, string[]> {
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

export function defaultMacroAgreementValidator(): MacroAgreementValidator {
  return new MacroAgreementValidator(
    [
      new MacroAgreementTitleLengthRule(32),
      new MacroAgreementAllowedTitleRule(["primary"]),
      new MacroAgreementRequiredTitleRule("macro agreement needs a value"),
      new MacroAgreementCodeLengthRule(64),
    ],
  );
}
