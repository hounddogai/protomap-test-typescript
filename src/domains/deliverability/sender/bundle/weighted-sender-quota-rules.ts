import { WeightedSenderQuota } from "./weighted-sender-quota.js";

/** A rule a weighted sender quota must pass. Check returns its problems, or none. */
export interface WeightedSenderQuotaRule {
  check(item: WeightedSenderQuota): string[];
}

export class WeightedSenderQuotaRequiredExternalRefRule implements WeightedSenderQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedSenderQuota): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedSenderQuotaExternalRefLengthRule implements WeightedSenderQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedSenderQuota): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedSenderQuotaCodePrefixRule implements WeightedSenderQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedSenderQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedSenderQuotaChannelLengthRule implements WeightedSenderQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedSenderQuota): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedSenderQuotaCodeLengthRule implements WeightedSenderQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedSenderQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted sender quota. */
export class WeightedSenderQuotaValidator {
  rules: WeightedSenderQuotaRule[];

  constructor(rules: WeightedSenderQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedSenderQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedSenderQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedSenderQuota[]): Map<string, string[]> {
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

export function defaultWeightedSenderQuotaValidator(): WeightedSenderQuotaValidator {
  return new WeightedSenderQuotaValidator(
    [
      new WeightedSenderQuotaRequiredExternalRefRule("weighted sender quota needs an entry"),
      new WeightedSenderQuotaExternalRefLengthRule(120),
      new WeightedSenderQuotaCodePrefixRule("REF"),
      new WeightedSenderQuotaChannelLengthRule(255),
      new WeightedSenderQuotaCodeLengthRule(120),
    ],
  );
}
