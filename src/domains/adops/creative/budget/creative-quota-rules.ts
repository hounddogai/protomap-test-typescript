import { CreativeQuota } from "./creative-quota.js";

/** A rule a creative quota must pass. Check returns its problems, or none. */
export interface CreativeQuotaRule {
  check(item: CreativeQuota): string[];
}

export class CreativeQuotaConversionRateRangeRule implements CreativeQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeQuota): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreativeQuotaRequiredCodeRule implements CreativeQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeQuotaRequiredChannelRule implements CreativeQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeQuota): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeQuotaCreatedAtRangeRule implements CreativeQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeQuota): string[] {
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

export class CreativeQuotaCodeLengthRule implements CreativeQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a creative quota. */
export class CreativeQuotaValidator {
  rules: CreativeQuotaRule[];

  constructor(rules: CreativeQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeQuota): string[] {
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

  requireValid(item: CreativeQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeQuota[]): Map<string, string[]> {
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

export function defaultCreativeQuotaValidator(): CreativeQuotaValidator {
  return new CreativeQuotaValidator(
    [
      new CreativeQuotaConversionRateRangeRule(0.6, 2705.4),
      new CreativeQuotaRequiredCodeRule("creative quota needs a value"),
      new CreativeQuotaRequiredChannelRule("creative quota needs an entry"),
      new CreativeQuotaCreatedAtRangeRule(120, 86400),
      new CreativeQuotaCodeLengthRule(64),
    ],
  );
}
