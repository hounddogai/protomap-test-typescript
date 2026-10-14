import { GlobalBranchPolicy } from "./global-branch-policy.js";

/** A rule a global branch policy must pass. Check returns its problems, or none. */
export interface GlobalBranchPolicyRule {
  check(item: GlobalBranchPolicy): string[];
}

export class GlobalBranchPolicyCodeLengthRule implements GlobalBranchPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalBranchPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalBranchPolicyChannelLengthRule implements GlobalBranchPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalBranchPolicy): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalBranchPolicyNameLengthRule implements GlobalBranchPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalBranchPolicy): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalBranchPolicyRequiredLocaleRule implements GlobalBranchPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalBranchPolicy): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalBranchPolicyLocaleLengthRule implements GlobalBranchPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalBranchPolicy): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global branch policy. */
export class GlobalBranchPolicyValidator {
  rules: GlobalBranchPolicyRule[];

  constructor(rules: GlobalBranchPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalBranchPolicy): string[] {
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

  requireValid(item: GlobalBranchPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalBranchPolicy[]): Map<string, string[]> {
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

export function defaultGlobalBranchPolicyValidator(): GlobalBranchPolicyValidator {
  return new GlobalBranchPolicyValidator(
    [
      new GlobalBranchPolicyCodeLengthRule(32),
      new GlobalBranchPolicyChannelLengthRule(86400),
      new GlobalBranchPolicyNameLengthRule(255),
      new GlobalBranchPolicyRequiredLocaleRule("global branch policy needs a value"),
      new GlobalBranchPolicyLocaleLengthRule(80),
    ],
  );
}
