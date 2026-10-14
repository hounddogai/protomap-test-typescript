import { DomainThreshold } from "./domain-threshold.js";

/** A rule a domain threshold must pass. Check returns its problems, or none. */
export interface DomainThresholdRule {
  check(item: DomainThreshold): string[];
}

export class DomainThresholdCodePrefixRule implements DomainThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DomainThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DomainThresholdExpiresAtRangeRule implements DomainThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainThreshold): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DomainThresholdRequiredCodeRule implements DomainThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DomainThresholdRequiredLabelRule implements DomainThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainThreshold): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a domain threshold. */
export class DomainThresholdValidator {
  rules: DomainThresholdRule[];

  constructor(rules: DomainThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: DomainThreshold): string[] {
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

  requireValid(item: DomainThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainThreshold[]): Map<string, string[]> {
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

export function defaultDomainThresholdValidator(): DomainThresholdValidator {
  return new DomainThresholdValidator(
    [
      new DomainThresholdCodePrefixRule("Q"),
      new DomainThresholdExpiresAtRangeRule(64, 255),
      new DomainThresholdRequiredCodeRule("domain threshold needs a value"),
      new DomainThresholdRequiredLabelRule("domain threshold needs this field"),
    ],
  );
}
