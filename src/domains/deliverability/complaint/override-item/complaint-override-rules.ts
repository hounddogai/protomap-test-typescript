import { ComplaintOverride } from "./complaint-override.js";

/** A rule a complaint override must pass. Check returns its problems, or none. */
export interface ComplaintOverrideRule {
  check(item: ComplaintOverride): string[];
}

export class ComplaintOverrideEndsAtRangeRule implements ComplaintOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintOverride): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ComplaintOverrideClicksRangeRule implements ComplaintOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintOverride): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ComplaintOverrideChecksumLengthRule implements ComplaintOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintOverride): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintOverrideLabelLengthRule implements ComplaintOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintOverride): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintOverrideScoreRangeRule implements ComplaintOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintOverride): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ComplaintOverrideRequiredChecksumRule implements ComplaintOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintOverride): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a complaint override. */
export class ComplaintOverrideValidator {
  rules: ComplaintOverrideRule[];

  constructor(rules: ComplaintOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintOverride): string[] {
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

  requireValid(item: ComplaintOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintOverride[]): Map<string, string[]> {
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

export function defaultComplaintOverrideValidator(): ComplaintOverrideValidator {
  return new ComplaintOverrideValidator(
    [
      new ComplaintOverrideEndsAtRangeRule(255, 3600),
      new ComplaintOverrideClicksRangeRule(16, 120),
      new ComplaintOverrideChecksumLengthRule(255),
      new ComplaintOverrideLabelLengthRule(120),
      new ComplaintOverrideScoreRangeRule(5.6, 890.5),
      new ComplaintOverrideRequiredChecksumRule("complaint override needs an entry"),
    ],
  );
}
