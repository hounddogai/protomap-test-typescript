import * as text from "../../../../kit/text.js";
import { ProofRollup } from "./proof-rollup.js";

/** A rule a proof rollup must pass. Check returns its problems, or none. */
export interface ProofRollupRule {
  check(item: ProofRollup): string[];
}

export class ProofRollupRequiredLabelRule implements ProofRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ProofRollupCodePrefixRule implements ProofRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ProofRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ProofRollupUnitLengthRule implements ProofRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofRollup): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofRollupAllowedUnitRule implements ProofRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ProofRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is too long`];
    return [];
  }
}

/** Runs every rule of a proof rollup. */
export class ProofRollupValidator {
  rules: ProofRollupRule[];

  constructor(rules: ProofRollupRule[]) {
    this.rules = rules;
  }

  validate(item: ProofRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ProofRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofRollup[]): Map<string, string[]> {
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

export function defaultProofRollupValidator(): ProofRollupValidator {
  return new ProofRollupValidator(
    [
      new ProofRollupRequiredLabelRule("proof rollup needs a value"),
      new ProofRollupCodePrefixRule("OPS"),
      new ProofRollupUnitLengthRule(1000),
      new ProofRollupAllowedUnitRule(["strict", "manual", "regional"]),
    ],
  );
}
