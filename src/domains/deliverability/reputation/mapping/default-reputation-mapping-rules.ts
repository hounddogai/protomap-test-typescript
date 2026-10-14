import { DefaultReputationMapping } from "./default-reputation-mapping.js";

/** A rule a default reputation mapping must pass. Check returns its problems, or none. */
export interface DefaultReputationMappingRule {
  check(item: DefaultReputationMapping): string[];
}

export class DefaultReputationMappingRequiredCodeRule implements DefaultReputationMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultReputationMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultReputationMappingCurrencyLengthRule implements DefaultReputationMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultReputationMapping): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultReputationMappingRequiredCurrencyRule implements DefaultReputationMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultReputationMapping): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultReputationMappingContactEmailLengthRule implements DefaultReputationMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultReputationMapping): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultReputationMappingCodePrefixRule implements DefaultReputationMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultReputationMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultReputationMappingCodeLengthRule implements DefaultReputationMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultReputationMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default reputation mapping. */
export class DefaultReputationMappingValidator {
  rules: DefaultReputationMappingRule[];

  constructor(rules: DefaultReputationMappingRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultReputationMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultReputationMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultReputationMapping[]): Map<string, string[]> {
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

export function defaultDefaultReputationMappingValidator(): DefaultReputationMappingValidator {
  return new DefaultReputationMappingValidator(
    [
      new DefaultReputationMappingRequiredCodeRule("default reputation mapping needs an entry"),
      new DefaultReputationMappingCurrencyLengthRule(80),
      new DefaultReputationMappingRequiredCurrencyRule("default reputation mapping needs this field"),
      new DefaultReputationMappingContactEmailLengthRule(64),
      new DefaultReputationMappingCodePrefixRule("Q"),
      new DefaultReputationMappingCodeLengthRule(80),
    ],
  );
}
