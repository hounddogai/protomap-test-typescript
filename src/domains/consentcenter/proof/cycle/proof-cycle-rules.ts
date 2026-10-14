import { ProofCycle } from "./proof-cycle.js";

/** A rule a proof cycle must pass. Check returns its problems, or none. */
export interface ProofCycleRule {
  check(item: ProofCycle): string[];
}

export class ProofCycleTitleLengthRule implements ProofCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofCycle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofCycleRequiredContactEmailRule implements ProofCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofCycle): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class ProofCycleCodePrefixRule implements ProofCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ProofCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ProofCycleRateRangeRule implements ProofCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofCycle): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a proof cycle. */
export class ProofCycleValidator {
  rules: ProofCycleRule[];

  constructor(rules: ProofCycleRule[]) {
    this.rules = rules;
  }

  validate(item: ProofCycle): string[] {
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

  requireValid(item: ProofCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofCycle[]): Map<string, string[]> {
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

export function defaultProofCycleValidator(): ProofCycleValidator {
  return new ProofCycleValidator(
    [
      new ProofCycleTitleLengthRule(1000),
      new ProofCycleRequiredContactEmailRule("proof cycle needs an entry"),
      new ProofCycleCodePrefixRule("Q"),
      new ProofCycleRateRangeRule(9.3, 3774.3),
    ],
  );
}
