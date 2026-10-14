import { ComplaintException } from "./complaint-exception.js";

/** A rule a complaint exception must pass. Check returns its problems, or none. */
export interface ComplaintExceptionRule {
  check(item: ComplaintException): string[];
}

export class ComplaintExceptionCodeLengthRule implements ComplaintExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintExceptionNameLengthRule implements ComplaintExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintException): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintExceptionRequiredCodeRule implements ComplaintExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintExceptionCodePrefixRule implements ComplaintExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ComplaintException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a complaint exception. */
export class ComplaintExceptionValidator {
  rules: ComplaintExceptionRule[];

  constructor(rules: ComplaintExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintException): string[] {
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

  requireValid(item: ComplaintException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintException[]): Map<string, string[]> {
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

export function defaultComplaintExceptionValidator(): ComplaintExceptionValidator {
  return new ComplaintExceptionValidator(
    [
      new ComplaintExceptionCodeLengthRule(64),
      new ComplaintExceptionNameLengthRule(32),
      new ComplaintExceptionRequiredCodeRule("complaint exception needs this field"),
      new ComplaintExceptionCodePrefixRule("REF"),
    ],
  );
}
