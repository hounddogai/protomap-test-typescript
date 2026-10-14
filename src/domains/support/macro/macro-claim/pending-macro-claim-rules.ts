import { PendingMacroClaim } from "./pending-macro-claim.js";

/** A rule a pending macro claim must pass. Check returns its problems, or none. */
export interface PendingMacroClaimRule {
  check(item: PendingMacroClaim): string[];
}

export class PendingMacroClaimRequiredChannelRule implements PendingMacroClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingMacroClaim): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PendingMacroClaimRatioRangeRule implements PendingMacroClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingMacroClaim): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingMacroClaimBudgetRangeRule implements PendingMacroClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingMacroClaim): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingMacroClaimChannelLengthRule implements PendingMacroClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingMacroClaim): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingMacroClaimRequiredTimezoneRule implements PendingMacroClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingMacroClaim): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending macro claim. */
export class PendingMacroClaimValidator {
  rules: PendingMacroClaimRule[];

  constructor(rules: PendingMacroClaimRule[]) {
    this.rules = rules;
  }

  validate(item: PendingMacroClaim): string[] {
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

  requireValid(item: PendingMacroClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingMacroClaim[]): Map<string, string[]> {
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

export function defaultPendingMacroClaimValidator(): PendingMacroClaimValidator {
  return new PendingMacroClaimValidator(
    [
      new PendingMacroClaimRequiredChannelRule("pending macro claim needs a value"),
      new PendingMacroClaimRatioRangeRule(2, 3365.2),
      new PendingMacroClaimBudgetRangeRule(5.2, 2864.5),
      new PendingMacroClaimChannelLengthRule(255),
      new PendingMacroClaimRequiredTimezoneRule("pending macro claim needs an entry"),
    ],
  );
}
