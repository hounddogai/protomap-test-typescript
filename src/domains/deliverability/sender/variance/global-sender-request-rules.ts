import { GlobalSenderRequest } from "./global-sender-request.js";

/** A rule a global sender request must pass. Check returns its problems, or none. */
export interface GlobalSenderRequestRule {
  check(item: GlobalSenderRequest): string[];
}

export class GlobalSenderRequestRequiredTitleRule implements GlobalSenderRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalSenderRequest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalSenderRequestOpenRateRangeRule implements GlobalSenderRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSenderRequest): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalSenderRequestRequiredLabelRule implements GlobalSenderRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalSenderRequest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalSenderRequestLabelLengthRule implements GlobalSenderRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSenderRequest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalSenderRequestVersionRangeRule implements GlobalSenderRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSenderRequest): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalSenderRequestCodeLengthRule implements GlobalSenderRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSenderRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global sender request. */
export class GlobalSenderRequestValidator {
  rules: GlobalSenderRequestRule[];

  constructor(rules: GlobalSenderRequestRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalSenderRequest): string[] {
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

  requireValid(item: GlobalSenderRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalSenderRequest[]): Map<string, string[]> {
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

export function defaultGlobalSenderRequestValidator(): GlobalSenderRequestValidator {
  return new GlobalSenderRequestValidator(
    [
      new GlobalSenderRequestRequiredTitleRule("global sender request needs a value"),
      new GlobalSenderRequestOpenRateRangeRule(9.4, 439.2),
      new GlobalSenderRequestRequiredLabelRule("global sender request needs an entry"),
      new GlobalSenderRequestLabelLengthRule(16),
      new GlobalSenderRequestVersionRangeRule(80, 86400),
      new GlobalSenderRequestCodeLengthRule(64),
    ],
  );
}
