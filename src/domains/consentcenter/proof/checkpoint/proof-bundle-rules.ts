import { ProofBundle } from "./proof-bundle.js";

/** A rule a proof bundle must pass. Check returns its problems, or none. */
export interface ProofBundleRule {
  check(item: ProofBundle): string[];
}

export class ProofBundleSegmentLengthRule implements ProofBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofBundle): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofBundleRequiredNameRule implements ProofBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofBundle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ProofBundleNameLengthRule implements ProofBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofBundleCurrencyLengthRule implements ProofBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofBundle): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofBundleCodePrefixRule implements ProofBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ProofBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ProofBundleCodeLengthRule implements ProofBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a proof bundle. */
export class ProofBundleValidator {
  rules: ProofBundleRule[];

  constructor(rules: ProofBundleRule[]) {
    this.rules = rules;
  }

  validate(item: ProofBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ProofBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofBundle[]): Map<string, string[]> {
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

export function defaultProofBundleValidator(): ProofBundleValidator {
  return new ProofBundleValidator(
    [
      new ProofBundleSegmentLengthRule(3600),
      new ProofBundleRequiredNameRule("proof bundle needs this field"),
      new ProofBundleNameLengthRule(86400),
      new ProofBundleCurrencyLengthRule(32),
      new ProofBundleCodePrefixRule("OPS"),
      new ProofBundleCodeLengthRule(3600),
    ],
  );
}
