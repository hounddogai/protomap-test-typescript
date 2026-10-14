import { DomainPolicy } from "./domain-policy.js";

/** A rule a domain policy must pass. Check returns its problems, or none. */
export interface DomainPolicyRule {
  check(item: DomainPolicy): string[];
}

export class DomainPolicyRequiredSummaryRule implements DomainPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainPolicy): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class DomainPolicyRequiredTitleRule implements DomainPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainPolicy): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DomainPolicyAmountRangeRule implements DomainPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainPolicy): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DomainPolicyCodeLengthRule implements DomainPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainPolicyCapacityRangeRule implements DomainPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainPolicy): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a domain policy. */
export class DomainPolicyValidator {
  rules: DomainPolicyRule[];

  constructor(rules: DomainPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: DomainPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DomainPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainPolicy[]): Map<string, string[]> {
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

export function defaultDomainPolicyValidator(): DomainPolicyValidator {
  return new DomainPolicyValidator(
    [
      new DomainPolicyRequiredSummaryRule("domain policy needs this field"),
      new DomainPolicyRequiredTitleRule("domain policy needs an entry"),
      new DomainPolicyAmountRangeRule(7.9, 2244.5),
      new DomainPolicyCodeLengthRule(3600),
      new DomainPolicyCapacityRangeRule(16, 255),
    ],
  );
}
