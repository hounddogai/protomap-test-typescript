import { AdaptiveFrequencyDigest } from "./adaptive-frequency-digest.js";

/** A rule a adaptive frequency digest must pass. Check returns its problems, or none. */
export interface AdaptiveFrequencyDigestRule {
  check(item: AdaptiveFrequencyDigest): string[];
}

export class AdaptiveFrequencyDigestSequenceRangeRule implements AdaptiveFrequencyDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFrequencyDigest): string[] {
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

export class AdaptiveFrequencyDigestBidRangeRule implements AdaptiveFrequencyDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFrequencyDigest): string[] {
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

export class AdaptiveFrequencyDigestRequiredCodeRule implements AdaptiveFrequencyDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFrequencyDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive frequency digest. */
export class AdaptiveFrequencyDigestValidator {
  rules: AdaptiveFrequencyDigestRule[];

  constructor(rules: AdaptiveFrequencyDigestRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveFrequencyDigest): string[] {
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

  requireValid(item: AdaptiveFrequencyDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveFrequencyDigest[]): Map<string, string[]> {
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

export function defaultAdaptiveFrequencyDigestValidator(): AdaptiveFrequencyDigestValidator {
  return new AdaptiveFrequencyDigestValidator(
    [
      new AdaptiveFrequencyDigestSequenceRangeRule(64, 64),
      new AdaptiveFrequencyDigestBidRangeRule(1.5, 654.3),
      new AdaptiveFrequencyDigestRequiredCodeRule("adaptive frequency digest needs a value"),
    ],
  );
}
