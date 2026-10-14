import { LenientFlightDraft } from "./lenient-flight-draft.js";

/** A rule a lenient flight draft must pass. Check returns its problems, or none. */
export interface LenientFlightDraftRule {
  check(item: LenientFlightDraft): string[];
}

export class LenientFlightDraftRequiredChannelRule implements LenientFlightDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientFlightDraft): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class LenientFlightDraftBidRangeRule implements LenientFlightDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientFlightDraft): string[] {
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

export class LenientFlightDraftChannelLengthRule implements LenientFlightDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientFlightDraft): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient flight draft. */
export class LenientFlightDraftValidator {
  rules: LenientFlightDraftRule[];

  constructor(rules: LenientFlightDraftRule[]) {
    this.rules = rules;
  }

  validate(item: LenientFlightDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientFlightDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientFlightDraft[]): Map<string, string[]> {
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

export function defaultLenientFlightDraftValidator(): LenientFlightDraftValidator {
  return new LenientFlightDraftValidator(
    [
      new LenientFlightDraftRequiredChannelRule("lenient flight draft needs this field"),
      new LenientFlightDraftBidRangeRule(4.7, 3123.6),
      new LenientFlightDraftChannelLengthRule(120),
    ],
  );
}
