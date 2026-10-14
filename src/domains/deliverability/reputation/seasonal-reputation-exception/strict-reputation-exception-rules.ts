import { StrictReputationException } from "./strict-reputation-exception.js";

/** A rule a strict reputation exception must pass. Check returns its problems, or none. */
export interface StrictReputationExceptionRule {
  check(item: StrictReputationException): string[];
}

export class StrictReputationExceptionRequiredNameRule implements StrictReputationExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictReputationException): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StrictReputationExceptionCodePrefixRule implements StrictReputationExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictReputationException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictReputationExceptionRequiredPhoneRule implements StrictReputationExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictReputationException): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class StrictReputationExceptionRequiredContactEmailRule implements StrictReputationExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictReputationException): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict reputation exception. */
export class StrictReputationExceptionValidator {
  rules: StrictReputationExceptionRule[];

  constructor(rules: StrictReputationExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: StrictReputationException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictReputationException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictReputationException[]): Map<string, string[]> {
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

export function defaultStrictReputationExceptionValidator(): StrictReputationExceptionValidator {
  return new StrictReputationExceptionValidator(
    [
      new StrictReputationExceptionRequiredNameRule("strict reputation exception needs a value"),
      new StrictReputationExceptionCodePrefixRule("ACM"),
      new StrictReputationExceptionRequiredPhoneRule("strict reputation exception needs a value"),
      new StrictReputationExceptionRequiredContactEmailRule("strict reputation exception needs a value"),
    ],
  );
}
