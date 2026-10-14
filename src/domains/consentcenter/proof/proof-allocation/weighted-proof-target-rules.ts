import { WeightedProofTarget } from "./weighted-proof-target.js";

/** A rule a weighted proof target must pass. Check returns its problems, or none. */
export interface WeightedProofTargetRule {
  check(item: WeightedProofTarget): string[];
}

export class WeightedProofTargetCodeLengthRule implements WeightedProofTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedProofTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedProofTargetRequiredTitleRule implements WeightedProofTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedProofTarget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedProofTargetCodePrefixRule implements WeightedProofTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedProofTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedProofTargetRequiredReviewerRule implements WeightedProofTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedProofTarget): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted proof target. */
export class WeightedProofTargetValidator {
  rules: WeightedProofTargetRule[];

  constructor(rules: WeightedProofTargetRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedProofTarget): string[] {
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

  requireValid(item: WeightedProofTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedProofTarget[]): Map<string, string[]> {
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

export function defaultWeightedProofTargetValidator(): WeightedProofTargetValidator {
  return new WeightedProofTargetValidator(
    [
      new WeightedProofTargetCodeLengthRule(255),
      new WeightedProofTargetRequiredTitleRule("weighted proof target needs a value"),
      new WeightedProofTargetCodePrefixRule("OPS"),
      new WeightedProofTargetRequiredReviewerRule("weighted proof target needs an entry"),
    ],
  );
}
