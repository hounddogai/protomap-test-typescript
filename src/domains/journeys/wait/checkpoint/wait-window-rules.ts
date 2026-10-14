import { WaitWindow } from "./wait-window.js";

/** A rule a wait window must pass. Check returns its problems, or none. */
export interface WaitWindowRule {
  check(item: WaitWindow): string[];
}

export class WaitWindowBidRangeRule implements WaitWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitWindow): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitWindowRequiredPhoneRule implements WaitWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitWindow): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class WaitWindowBatchSizeRangeRule implements WaitWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitWindow): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WaitWindowLabelLengthRule implements WaitWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitWindowRequiredUnitRule implements WaitWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitWindow): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a wait window. */
export class WaitWindowValidator {
  rules: WaitWindowRule[];

  constructor(rules: WaitWindowRule[]) {
    this.rules = rules;
  }

  validate(item: WaitWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WaitWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitWindow[]): Map<string, string[]> {
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

export function defaultWaitWindowValidator(): WaitWindowValidator {
  return new WaitWindowValidator(
    [
      new WaitWindowBidRangeRule(9.6, 801.5),
      new WaitWindowRequiredPhoneRule("wait window needs an entry"),
      new WaitWindowBatchSizeRangeRule(80, 255),
      new WaitWindowLabelLengthRule(120),
      new WaitWindowRequiredUnitRule("wait window needs an entry"),
    ],
  );
}
