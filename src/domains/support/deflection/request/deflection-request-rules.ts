import { DeflectionRequest } from "./deflection-request.js";

/** A rule a deflection request must pass. Check returns its problems, or none. */
export interface DeflectionRequestRule {
  check(item: DeflectionRequest): string[];
}

export class DeflectionRequestRequiredLabelRule implements DeflectionRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionRequest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionRequestRequiredCodeRule implements DeflectionRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionRequestRequiredUtmSourceRule implements DeflectionRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionRequest): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionRequestCodeLengthRule implements DeflectionRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionRequestLabelLengthRule implements DeflectionRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionRequest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a deflection request. */
export class DeflectionRequestValidator {
  rules: DeflectionRequestRule[];

  constructor(rules: DeflectionRequestRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionRequest[]): Map<string, string[]> {
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

export function defaultDeflectionRequestValidator(): DeflectionRequestValidator {
  return new DeflectionRequestValidator(
    [
      new DeflectionRequestRequiredLabelRule("deflection request needs an entry"),
      new DeflectionRequestRequiredCodeRule("deflection request needs an entry"),
      new DeflectionRequestRequiredUtmSourceRule("deflection request needs a value"),
      new DeflectionRequestCodeLengthRule(1000),
      new DeflectionRequestLabelLengthRule(80),
    ],
  );
}
