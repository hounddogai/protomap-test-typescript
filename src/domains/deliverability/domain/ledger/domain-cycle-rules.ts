import { DomainCycle } from "./domain-cycle.js";

/** A rule a domain cycle must pass. Check returns its problems, or none. */
export interface DomainCycleRule {
  check(item: DomainCycle): string[];
}

export class DomainCycleCodeLengthRule implements DomainCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainCycleCodePrefixRule implements DomainCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DomainCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DomainCycleRequiredNameRule implements DomainCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DomainCycleRequiredVariantRule implements DomainCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainCycle): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a domain cycle. */
export class DomainCycleValidator {
  rules: DomainCycleRule[];

  constructor(rules: DomainCycleRule[]) {
    this.rules = rules;
  }

  validate(item: DomainCycle): string[] {
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

  requireValid(item: DomainCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainCycle[]): Map<string, string[]> {
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

export function defaultDomainCycleValidator(): DomainCycleValidator {
  return new DomainCycleValidator(
    [
      new DomainCycleCodeLengthRule(80),
      new DomainCycleCodePrefixRule("Q"),
      new DomainCycleRequiredNameRule("domain cycle needs an entry"),
      new DomainCycleRequiredVariantRule("domain cycle needs this field"),
    ],
  );
}
