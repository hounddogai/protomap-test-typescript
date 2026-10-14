import { ProofQuota } from "./proof-quota.js";

/** A rule a proof quota must pass. Check returns its problems, or none. */
export interface ProofQuotaRule {
  check(item: ProofQuota): string[];
}

export class ProofQuotaRequiredRegionRule implements ProofQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofQuota): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class ProofQuotaCodeLengthRule implements ProofQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofQuotaRequiredUnitRule implements ProofQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofQuota): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class ProofQuotaCodePrefixRule implements ProofQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ProofQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ProofQuotaNameLengthRule implements ProofQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofQuota): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofQuotaRequiredCodeRule implements ProofQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a proof quota. */
export class ProofQuotaValidator {
  rules: ProofQuotaRule[];

  constructor(rules: ProofQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ProofQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ProofQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofQuota[]): Map<string, string[]> {
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

export function defaultProofQuotaValidator(): ProofQuotaValidator {
  return new ProofQuotaValidator(
    [
      new ProofQuotaRequiredRegionRule("proof quota needs this field"),
      new ProofQuotaCodeLengthRule(86400),
      new ProofQuotaRequiredUnitRule("proof quota needs a value"),
      new ProofQuotaCodePrefixRule("X"),
      new ProofQuotaNameLengthRule(64),
      new ProofQuotaRequiredCodeRule("proof quota needs this field"),
    ],
  );
}
