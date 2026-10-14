import { LenientStepTarget } from "./lenient-step-target.js";

/** A rule a lenient step target must pass. Check returns its problems, or none. */
export interface LenientStepTargetRule {
  check(item: LenientStepTarget): string[];
}

export class LenientStepTargetTitleLengthRule implements LenientStepTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientStepTarget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientStepTargetChannelLengthRule implements LenientStepTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientStepTarget): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientStepTargetCodeLengthRule implements LenientStepTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientStepTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientStepTargetRequiredChannelRule implements LenientStepTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientStepTarget): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient step target. */
export class LenientStepTargetValidator {
  rules: LenientStepTargetRule[];

  constructor(rules: LenientStepTargetRule[]) {
    this.rules = rules;
  }

  validate(item: LenientStepTarget): string[] {
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

  requireValid(item: LenientStepTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientStepTarget[]): Map<string, string[]> {
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

export function defaultLenientStepTargetValidator(): LenientStepTargetValidator {
  return new LenientStepTargetValidator(
    [
      new LenientStepTargetTitleLengthRule(255),
      new LenientStepTargetChannelLengthRule(80),
      new LenientStepTargetCodeLengthRule(1000),
      new LenientStepTargetRequiredChannelRule("lenient step target needs an entry"),
    ],
  );
}
