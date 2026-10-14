import { ConversionPolicy } from "./conversion-policy.js";

/** A rule a conversion policy must pass. Check returns its problems, or none. */
export interface ConversionPolicyRule {
  check(item: ConversionPolicy): string[];
}

export class ConversionPolicyRequiredCodeRule implements ConversionPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionPolicyNotesLengthRule implements ConversionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionPolicy): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionPolicyCountryLengthRule implements ConversionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionPolicy): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a conversion policy. */
export class ConversionPolicyValidator {
  rules: ConversionPolicyRule[];

  constructor(rules: ConversionPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ConversionPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionPolicy[]): Map<string, string[]> {
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

export function defaultConversionPolicyValidator(): ConversionPolicyValidator {
  return new ConversionPolicyValidator(
    [
      new ConversionPolicyRequiredCodeRule("conversion policy needs a value"),
      new ConversionPolicyNotesLengthRule(255),
      new ConversionPolicyCountryLengthRule(86400),
    ],
  );
}
