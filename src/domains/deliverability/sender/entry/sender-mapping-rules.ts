import { SenderMapping } from "./sender-mapping.js";

/** A rule a sender mapping must pass. Check returns its problems, or none. */
export interface SenderMappingRule {
  check(item: SenderMapping): string[];
}

export class SenderMappingRequiredCodeRule implements SenderMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SenderMappingLimitRangeRule implements SenderMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderMapping): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SenderMappingQuantityRangeRule implements SenderMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderMapping): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SenderMappingCodeLengthRule implements SenderMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderMappingBidRangeRule implements SenderMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderMapping): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a sender mapping. */
export class SenderMappingValidator {
  rules: SenderMappingRule[];

  constructor(rules: SenderMappingRule[]) {
    this.rules = rules;
  }

  validate(item: SenderMapping): string[] {
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

  requireValid(item: SenderMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderMapping[]): Map<string, string[]> {
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

export function defaultSenderMappingValidator(): SenderMappingValidator {
  return new SenderMappingValidator(
    [
      new SenderMappingRequiredCodeRule("sender mapping needs this field"),
      new SenderMappingLimitRangeRule(3600, 3600),
      new SenderMappingQuantityRangeRule(80, 1000),
      new SenderMappingCodeLengthRule(16),
      new SenderMappingBidRangeRule(4, 2029.5),
    ],
  );
}
