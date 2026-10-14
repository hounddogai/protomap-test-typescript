import * as text from "../../../../kit/text.js";
import { ModelAgreement } from "./model-agreement.js";

/** A rule a model agreement must pass. Check returns its problems, or none. */
export interface ModelAgreementRule {
  check(item: ModelAgreement): string[];
}

export class ModelAgreementRequiredCodeRule implements ModelAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ModelAgreementRequiredTitleRule implements ModelAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ModelAgreementCodeLengthRule implements ModelAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelAgreementCodePrefixRule implements ModelAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ModelAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ModelAgreementAllowedCodeRule implements ModelAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ModelAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class ModelAgreementTitleLengthRule implements ModelAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a model agreement. */
export class ModelAgreementValidator {
  rules: ModelAgreementRule[];

  constructor(rules: ModelAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ModelAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelAgreement[]): Map<string, string[]> {
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

export function defaultModelAgreementValidator(): ModelAgreementValidator {
  return new ModelAgreementValidator(
    [
      new ModelAgreementRequiredCodeRule("model agreement needs this field"),
      new ModelAgreementRequiredTitleRule("model agreement needs an entry"),
      new ModelAgreementCodeLengthRule(80),
      new ModelAgreementCodePrefixRule("ACM"),
      new ModelAgreementAllowedCodeRule(["pending", "batched"]),
      new ModelAgreementTitleLengthRule(32),
    ],
  );
}
