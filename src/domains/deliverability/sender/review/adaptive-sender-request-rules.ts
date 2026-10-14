import { AdaptiveSenderRequest } from "./adaptive-sender-request.js";

/** A rule a adaptive sender request must pass. Check returns its problems, or none. */
export interface AdaptiveSenderRequestRule {
  check(item: AdaptiveSenderRequest): string[];
}

export class AdaptiveSenderRequestMarginRangeRule implements AdaptiveSenderRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveSenderRequest): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveSenderRequestWeightRangeRule implements AdaptiveSenderRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveSenderRequest): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveSenderRequestSegmentLengthRule implements AdaptiveSenderRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveSenderRequest): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveSenderRequestRequiredSegmentRule implements AdaptiveSenderRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveSenderRequest): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive sender request. */
export class AdaptiveSenderRequestValidator {
  rules: AdaptiveSenderRequestRule[];

  constructor(rules: AdaptiveSenderRequestRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveSenderRequest): string[] {
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

  requireValid(item: AdaptiveSenderRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveSenderRequest[]): Map<string, string[]> {
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

export function defaultAdaptiveSenderRequestValidator(): AdaptiveSenderRequestValidator {
  return new AdaptiveSenderRequestValidator(
    [
      new AdaptiveSenderRequestMarginRangeRule(4.3, 2456),
      new AdaptiveSenderRequestWeightRangeRule(9, 3396),
      new AdaptiveSenderRequestSegmentLengthRule(86400),
      new AdaptiveSenderRequestRequiredSegmentRule("adaptive sender request needs this field"),
    ],
  );
}
