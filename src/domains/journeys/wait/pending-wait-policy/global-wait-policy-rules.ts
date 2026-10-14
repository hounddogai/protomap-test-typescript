import { GlobalWaitPolicy } from "./global-wait-policy.js";

/** A rule a global wait policy must pass. Check returns its problems, or none. */
export interface GlobalWaitPolicyRule {
  check(item: GlobalWaitPolicy): string[];
}

export class GlobalWaitPolicyLabelLengthRule implements GlobalWaitPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalWaitPolicy): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalWaitPolicyRequiredLabelRule implements GlobalWaitPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalWaitPolicy): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalWaitPolicyCodeLengthRule implements GlobalWaitPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalWaitPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalWaitPolicyVisibleGuardRule implements GlobalWaitPolicyRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalWaitPolicy): string[] {
    if (item.visible && item.retries > this.limit) return [`retries ${item.retries} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class GlobalWaitPolicyRequiredSegmentRule implements GlobalWaitPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalWaitPolicy): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global wait policy. */
export class GlobalWaitPolicyValidator {
  rules: GlobalWaitPolicyRule[];

  constructor(rules: GlobalWaitPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalWaitPolicy): string[] {
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

  requireValid(item: GlobalWaitPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalWaitPolicy[]): Map<string, string[]> {
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

export function defaultGlobalWaitPolicyValidator(): GlobalWaitPolicyValidator {
  return new GlobalWaitPolicyValidator(
    [
      new GlobalWaitPolicyLabelLengthRule(1000),
      new GlobalWaitPolicyRequiredLabelRule("global wait policy needs a value"),
      new GlobalWaitPolicyCodeLengthRule(64),
      new GlobalWaitPolicyVisibleGuardRule(16),
      new GlobalWaitPolicyRequiredSegmentRule("global wait policy needs an entry"),
    ],
  );
}
