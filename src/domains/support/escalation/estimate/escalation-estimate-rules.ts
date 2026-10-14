import { EscalationEstimate } from "./escalation-estimate.js";

/** A rule a escalation estimate must pass. Check returns its problems, or none. */
export interface EscalationEstimateRule {
  check(item: EscalationEstimate): string[];
}

export class EscalationEstimateRequiredAudienceIdRule implements EscalationEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationEstimate): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationEstimateScoreRangeRule implements EscalationEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationEstimate): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EscalationEstimateAudienceIdLengthRule implements EscalationEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationEstimate): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationEstimateRequiredContactEmailRule implements EscalationEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationEstimate): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationEstimateRequiredNameRule implements EscalationEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a escalation estimate. */
export class EscalationEstimateValidator {
  rules: EscalationEstimateRule[];

  constructor(rules: EscalationEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationEstimate[]): Map<string, string[]> {
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

export function defaultEscalationEstimateValidator(): EscalationEstimateValidator {
  return new EscalationEstimateValidator(
    [
      new EscalationEstimateRequiredAudienceIdRule("escalation estimate needs an entry"),
      new EscalationEstimateScoreRangeRule(9.3, 3398),
      new EscalationEstimateAudienceIdLengthRule(80),
      new EscalationEstimateRequiredContactEmailRule("escalation estimate needs this field"),
      new EscalationEstimateRequiredNameRule("escalation estimate needs this field"),
    ],
  );
}
