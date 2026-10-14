import { WindowRequest } from "./window-request.js";

/** A rule a window request must pass. Check returns its problems, or none. */
export interface WindowRequestRule {
  check(item: WindowRequest): string[];
}

export class WindowRequestRequiredAudienceIdRule implements WindowRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowRequest): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class WindowRequestCodePrefixRule implements WindowRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WindowRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WindowRequestRequiredCodeRule implements WindowRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WindowRequestAttemptsRangeRule implements WindowRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowRequest): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a window request. */
export class WindowRequestValidator {
  rules: WindowRequestRule[];

  constructor(rules: WindowRequestRule[]) {
    this.rules = rules;
  }

  validate(item: WindowRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WindowRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowRequest[]): Map<string, string[]> {
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

export function defaultWindowRequestValidator(): WindowRequestValidator {
  return new WindowRequestValidator(
    [
      new WindowRequestRequiredAudienceIdRule("window request needs a value"),
      new WindowRequestCodePrefixRule("REF"),
      new WindowRequestRequiredCodeRule("window request needs an entry"),
      new WindowRequestAttemptsRangeRule(64, 80),
    ],
  );
}
