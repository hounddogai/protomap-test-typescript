import { ProofTier } from "./proof-tier.js";

/** A rule a proof tier must pass. Check returns its problems, or none. */
export interface ProofTierRule {
  check(item: ProofTier): string[];
}

export class ProofTierCodePrefixRule implements ProofTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ProofTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ProofTierRequiredCodeRule implements ProofTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ProofTierRequiredTitleRule implements ProofTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a proof tier. */
export class ProofTierValidator {
  rules: ProofTierRule[];

  constructor(rules: ProofTierRule[]) {
    this.rules = rules;
  }

  validate(item: ProofTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ProofTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofTier[]): Map<string, string[]> {
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

export function defaultProofTierValidator(): ProofTierValidator {
  return new ProofTierValidator(
    [
      new ProofTierCodePrefixRule("OPS"),
      new ProofTierRequiredCodeRule("proof tier needs a value"),
      new ProofTierRequiredTitleRule("proof tier needs an entry"),
    ],
  );
}
