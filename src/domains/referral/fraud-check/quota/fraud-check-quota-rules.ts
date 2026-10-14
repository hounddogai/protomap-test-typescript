import { FraudCheckQuota } from "./fraud-check-quota.js";

/** A rule a fraud check quota must pass. Check returns its problems, or none. */
export interface FraudCheckQuotaRule {
  check(item: FraudCheckQuota): string[];
}

export class FraudCheckQuotaRequiredChannelRule implements FraudCheckQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckQuota): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckQuotaRequiredNameRule implements FraudCheckQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckQuota): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckQuotaCodePrefixRule implements FraudCheckQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FraudCheckQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a fraud check quota. */
export class FraudCheckQuotaValidator {
  rules: FraudCheckQuotaRule[];

  constructor(rules: FraudCheckQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckQuota[]): Map<string, string[]> {
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

export function defaultFraudCheckQuotaValidator(): FraudCheckQuotaValidator {
  return new FraudCheckQuotaValidator(
    [
      new FraudCheckQuotaRequiredChannelRule("fraud check quota needs a value"),
      new FraudCheckQuotaRequiredNameRule("fraud check quota needs an entry"),
      new FraudCheckQuotaCodePrefixRule("REF"),
    ],
  );
}
