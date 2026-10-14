import { InviteSegment } from "./invite-segment.js";

/** A rule a invite segment must pass. Check returns its problems, or none. */
export interface InviteSegmentRule {
  check(item: InviteSegment): string[];
}

export class InviteSegmentTitleLengthRule implements InviteSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteSegment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteSegmentAmountRangeRule implements InviteSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteSegment): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InviteSegmentCodeLengthRule implements InviteSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteSegmentRequiredCodeRule implements InviteSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InviteSegmentSendAtRangeRule implements InviteSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteSegment): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InviteSegmentRequiredRegionRule implements InviteSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteSegment): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a invite segment. */
export class InviteSegmentValidator {
  rules: InviteSegmentRule[];

  constructor(rules: InviteSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: InviteSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteSegment[]): Map<string, string[]> {
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

export function defaultInviteSegmentValidator(): InviteSegmentValidator {
  return new InviteSegmentValidator(
    [
      new InviteSegmentTitleLengthRule(3600),
      new InviteSegmentAmountRangeRule(7.1, 4132.1),
      new InviteSegmentCodeLengthRule(16),
      new InviteSegmentRequiredCodeRule("invite segment needs this field"),
      new InviteSegmentSendAtRangeRule(32, 64),
      new InviteSegmentRequiredRegionRule("invite segment needs an entry"),
    ],
  );
}
