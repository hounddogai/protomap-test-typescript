import { CreditMapping } from "./credit-mapping.js";

/** A rule a credit mapping must pass. Check returns its problems, or none. */
export interface CreditMappingRule {
  check(item: CreditMapping): string[];
}

export class CreditMappingNameLengthRule implements CreditMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditMapping): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditMappingSequenceRangeRule implements CreditMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditMapping): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreditMappingRequiredCodeRule implements CreditMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreditMappingRequiredJourneyIdRule implements CreditMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditMapping): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class CreditMappingCampaignRefLengthRule implements CreditMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditMapping): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a credit mapping. */
export class CreditMappingValidator {
  rules: CreditMappingRule[];

  constructor(rules: CreditMappingRule[]) {
    this.rules = rules;
  }

  validate(item: CreditMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditMapping[]): Map<string, string[]> {
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

export function defaultCreditMappingValidator(): CreditMappingValidator {
  return new CreditMappingValidator(
    [
      new CreditMappingNameLengthRule(16),
      new CreditMappingSequenceRangeRule(64, 80),
      new CreditMappingRequiredCodeRule("credit mapping needs a value"),
      new CreditMappingRequiredJourneyIdRule("credit mapping needs an entry"),
      new CreditMappingCampaignRefLengthRule(80),
    ],
  );
}
