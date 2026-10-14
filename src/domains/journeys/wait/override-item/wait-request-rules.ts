import { WaitRequest } from "./wait-request.js";

/** A rule a wait request must pass. Check returns its problems, or none. */
export interface WaitRequestRule {
  check(item: WaitRequest): string[];
}

export class WaitRequestNotesLengthRule implements WaitRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitRequest): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitRequestRequiredTitleRule implements WaitRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitRequest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WaitRequestCodePrefixRule implements WaitRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WaitRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a wait request. */
export class WaitRequestValidator {
  rules: WaitRequestRule[];

  constructor(rules: WaitRequestRule[]) {
    this.rules = rules;
  }

  validate(item: WaitRequest): string[] {
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

  requireValid(item: WaitRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitRequest[]): Map<string, string[]> {
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

export function defaultWaitRequestValidator(): WaitRequestValidator {
  return new WaitRequestValidator(
    [
      new WaitRequestNotesLengthRule(32),
      new WaitRequestRequiredTitleRule("wait request needs an entry"),
      new WaitRequestCodePrefixRule("ACM"),
    ],
  );
}
