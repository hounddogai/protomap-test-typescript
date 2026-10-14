import { RollingSenderQuota } from "./rolling-sender-quota.js";

/** A rule a rolling sender quota must pass. Check returns its problems, or none. */
export interface RollingSenderQuotaRule {
  check(item: RollingSenderQuota): string[];
}

export class RollingSenderQuotaCodeLengthRule implements RollingSenderQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingSenderQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingSenderQuotaCodePrefixRule implements RollingSenderQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingSenderQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingSenderQuotaRequiredPhoneRule implements RollingSenderQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSenderQuota): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class RollingSenderQuotaCreatedAtRangeRule implements RollingSenderQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingSenderQuota): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingSenderQuotaRequiredNameRule implements RollingSenderQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSenderQuota): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling sender quota. */
export class RollingSenderQuotaValidator {
  rules: RollingSenderQuotaRule[];

  constructor(rules: RollingSenderQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: RollingSenderQuota): string[] {
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

  requireValid(item: RollingSenderQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingSenderQuota[]): Map<string, string[]> {
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

export function defaultRollingSenderQuotaValidator(): RollingSenderQuotaValidator {
  return new RollingSenderQuotaValidator(
    [
      new RollingSenderQuotaCodeLengthRule(86400),
      new RollingSenderQuotaCodePrefixRule("REF"),
      new RollingSenderQuotaRequiredPhoneRule("rolling sender quota needs an entry"),
      new RollingSenderQuotaCreatedAtRangeRule(255, 255),
      new RollingSenderQuotaRequiredNameRule("rolling sender quota needs this field"),
    ],
  );
}
