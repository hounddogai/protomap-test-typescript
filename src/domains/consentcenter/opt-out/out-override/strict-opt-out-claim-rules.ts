import { StrictOptOutClaim } from "./strict-opt-out-claim.js";

/** A rule a strict opt out claim must pass. Check returns its problems, or none. */
export interface StrictOptOutClaimRule {
  check(item: StrictOptOutClaim): string[];
}

export class StrictOptOutClaimRequiredTitleRule implements StrictOptOutClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictOptOutClaim): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictOptOutClaimCodePrefixRule implements StrictOptOutClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictOptOutClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictOptOutClaimCodeLengthRule implements StrictOptOutClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictOptOutClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictOptOutClaimRequiredCodeRule implements StrictOptOutClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictOptOutClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictOptOutClaimRequiredNameRule implements StrictOptOutClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictOptOutClaim): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict opt out claim. */
export class StrictOptOutClaimValidator {
  rules: StrictOptOutClaimRule[];

  constructor(rules: StrictOptOutClaimRule[]) {
    this.rules = rules;
  }

  validate(item: StrictOptOutClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictOptOutClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictOptOutClaim[]): Map<string, string[]> {
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

export function defaultStrictOptOutClaimValidator(): StrictOptOutClaimValidator {
  return new StrictOptOutClaimValidator(
    [
      new StrictOptOutClaimRequiredTitleRule("strict opt out claim needs this field"),
      new StrictOptOutClaimCodePrefixRule("ACM"),
      new StrictOptOutClaimCodeLengthRule(32),
      new StrictOptOutClaimRequiredCodeRule("strict opt out claim needs this field"),
      new StrictOptOutClaimRequiredNameRule("strict opt out claim needs this field"),
    ],
  );
}
