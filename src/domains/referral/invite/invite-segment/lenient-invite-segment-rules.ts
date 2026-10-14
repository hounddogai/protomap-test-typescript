import { LenientInviteSegment } from "./lenient-invite-segment.js";

/** A rule a lenient invite segment must pass. Check returns its problems, or none. */
export interface LenientInviteSegmentRule {
  check(item: LenientInviteSegment): string[];
}

export class LenientInviteSegmentRequiredJourneyIdRule implements LenientInviteSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientInviteSegment): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class LenientInviteSegmentRequiredCodeRule implements LenientInviteSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientInviteSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientInviteSegmentCodeLengthRule implements LenientInviteSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientInviteSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientInviteSegmentRequiredUnitRule implements LenientInviteSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientInviteSegment): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient invite segment. */
export class LenientInviteSegmentValidator {
  rules: LenientInviteSegmentRule[];

  constructor(rules: LenientInviteSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: LenientInviteSegment): string[] {
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

  requireValid(item: LenientInviteSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientInviteSegment[]): Map<string, string[]> {
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

export function defaultLenientInviteSegmentValidator(): LenientInviteSegmentValidator {
  return new LenientInviteSegmentValidator(
    [
      new LenientInviteSegmentRequiredJourneyIdRule("lenient invite segment needs an entry"),
      new LenientInviteSegmentRequiredCodeRule("lenient invite segment needs a value"),
      new LenientInviteSegmentCodeLengthRule(3600),
      new LenientInviteSegmentRequiredUnitRule("lenient invite segment needs an entry"),
    ],
  );
}
