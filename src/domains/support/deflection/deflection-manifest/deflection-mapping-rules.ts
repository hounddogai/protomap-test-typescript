import { DeflectionMapping } from "./deflection-mapping.js";

/** A rule a deflection mapping must pass. Check returns its problems, or none. */
export interface DeflectionMappingRule {
  check(item: DeflectionMapping): string[];
}

export class DeflectionMappingExternalRefLengthRule implements DeflectionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionMapping): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionMappingCodeLengthRule implements DeflectionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionMappingRequiredExternalRefRule implements DeflectionMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionMapping): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a deflection mapping. */
export class DeflectionMappingValidator {
  rules: DeflectionMappingRule[];

  constructor(rules: DeflectionMappingRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionMapping[]): Map<string, string[]> {
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

export function defaultDeflectionMappingValidator(): DeflectionMappingValidator {
  return new DeflectionMappingValidator(
    [
      new DeflectionMappingExternalRefLengthRule(86400),
      new DeflectionMappingCodeLengthRule(80),
      new DeflectionMappingRequiredExternalRefRule("deflection mapping needs an entry"),
    ],
  );
}
