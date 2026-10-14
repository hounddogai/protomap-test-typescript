import { AdaptiveDomainDigest } from "./adaptive-domain-digest.js";

/** A rule a adaptive domain digest must pass. Check returns its problems, or none. */
export interface AdaptiveDomainDigestRule {
  check(item: AdaptiveDomainDigest): string[];
}

export class AdaptiveDomainDigestBatchSizeRangeRule implements AdaptiveDomainDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveDomainDigest): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveDomainDigestRequiredUnitRule implements AdaptiveDomainDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveDomainDigest): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveDomainDigestRequiredCodeRule implements AdaptiveDomainDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveDomainDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveDomainDigestCodeLengthRule implements AdaptiveDomainDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDomainDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveDomainDigestUnitLengthRule implements AdaptiveDomainDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDomainDigest): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveDomainDigestWindowDaysRangeRule implements AdaptiveDomainDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveDomainDigest): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a adaptive domain digest. */
export class AdaptiveDomainDigestValidator {
  rules: AdaptiveDomainDigestRule[];

  constructor(rules: AdaptiveDomainDigestRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveDomainDigest): string[] {
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

  requireValid(item: AdaptiveDomainDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveDomainDigest[]): Map<string, string[]> {
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

export function defaultAdaptiveDomainDigestValidator(): AdaptiveDomainDigestValidator {
  return new AdaptiveDomainDigestValidator(
    [
      new AdaptiveDomainDigestBatchSizeRangeRule(3600, 86400),
      new AdaptiveDomainDigestRequiredUnitRule("adaptive domain digest needs a value"),
      new AdaptiveDomainDigestRequiredCodeRule("adaptive domain digest needs an entry"),
      new AdaptiveDomainDigestCodeLengthRule(32),
      new AdaptiveDomainDigestUnitLengthRule(16),
      new AdaptiveDomainDigestWindowDaysRangeRule(80, 120),
    ],
  );
}
