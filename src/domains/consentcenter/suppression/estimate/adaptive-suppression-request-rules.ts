import { AdaptiveSuppressionRequest } from "./adaptive-suppression-request.js";

/** A rule a adaptive suppression request must pass. Check returns its problems, or none. */
export interface AdaptiveSuppressionRequestRule {
  check(item: AdaptiveSuppressionRequest): string[];
}

export class AdaptiveSuppressionRequestRequiredTitleRule implements AdaptiveSuppressionRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveSuppressionRequest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveSuppressionRequestActiveGuardRule implements AdaptiveSuppressionRequestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveSuppressionRequest): string[] {
    if (item.active && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while active`];
    return [];
  }
}

export class AdaptiveSuppressionRequestRequiredDescriptionRule implements AdaptiveSuppressionRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveSuppressionRequest): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveSuppressionRequestContactEmailLengthRule implements AdaptiveSuppressionRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveSuppressionRequest): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveSuppressionRequestAttemptsRangeRule implements AdaptiveSuppressionRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveSuppressionRequest): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a adaptive suppression request. */
export class AdaptiveSuppressionRequestValidator {
  rules: AdaptiveSuppressionRequestRule[];

  constructor(rules: AdaptiveSuppressionRequestRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveSuppressionRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveSuppressionRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveSuppressionRequest[]): Map<string, string[]> {
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

export function defaultAdaptiveSuppressionRequestValidator(): AdaptiveSuppressionRequestValidator {
  return new AdaptiveSuppressionRequestValidator(
    [
      new AdaptiveSuppressionRequestRequiredTitleRule("adaptive suppression request needs an entry"),
      new AdaptiveSuppressionRequestActiveGuardRule(120),
      new AdaptiveSuppressionRequestRequiredDescriptionRule("adaptive suppression request needs a value"),
      new AdaptiveSuppressionRequestContactEmailLengthRule(86400),
      new AdaptiveSuppressionRequestAttemptsRangeRule(80, 255),
    ],
  );
}
