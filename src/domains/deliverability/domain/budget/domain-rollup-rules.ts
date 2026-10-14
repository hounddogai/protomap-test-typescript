import { DomainRollup } from "./domain-rollup.js";

/** A rule a domain rollup must pass. Check returns its problems, or none. */
export interface DomainRollupRule {
  check(item: DomainRollup): string[];
}

export class DomainRollupRequiredCodeRule implements DomainRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DomainRollupChannelLengthRule implements DomainRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainRollup): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainRollupRequiredRegionRule implements DomainRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainRollup): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class DomainRollupRequiredLabelRule implements DomainRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a domain rollup. */
export class DomainRollupValidator {
  rules: DomainRollupRule[];

  constructor(rules: DomainRollupRule[]) {
    this.rules = rules;
  }

  validate(item: DomainRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DomainRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainRollup[]): Map<string, string[]> {
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

export function defaultDomainRollupValidator(): DomainRollupValidator {
  return new DomainRollupValidator(
    [
      new DomainRollupRequiredCodeRule("domain rollup needs an entry"),
      new DomainRollupChannelLengthRule(255),
      new DomainRollupRequiredRegionRule("domain rollup needs an entry"),
      new DomainRollupRequiredLabelRule("domain rollup needs this field"),
    ],
  );
}
