import { LenientDomainRequest } from "./lenient-domain-request.js";

/** A rule a lenient domain request must pass. Check returns its problems, or none. */
export interface LenientDomainRequestRule {
  check(item: LenientDomainRequest): string[];
}

export class LenientDomainRequestCodePrefixRule implements LenientDomainRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientDomainRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientDomainRequestCodeLengthRule implements LenientDomainRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientDomainRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientDomainRequestRequiredCodeRule implements LenientDomainRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientDomainRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient domain request. */
export class LenientDomainRequestValidator {
  rules: LenientDomainRequestRule[];

  constructor(rules: LenientDomainRequestRule[]) {
    this.rules = rules;
  }

  validate(item: LenientDomainRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientDomainRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientDomainRequest[]): Map<string, string[]> {
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

export function defaultLenientDomainRequestValidator(): LenientDomainRequestValidator {
  return new LenientDomainRequestValidator(
    [
      new LenientDomainRequestCodePrefixRule("Q"),
      new LenientDomainRequestCodeLengthRule(64),
      new LenientDomainRequestRequiredCodeRule("lenient domain request needs a value"),
    ],
  );
}
