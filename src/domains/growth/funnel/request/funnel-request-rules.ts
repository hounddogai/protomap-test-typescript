import { FunnelRequest } from "./funnel-request.js";

/** A rule a funnel request must pass. Check returns its problems, or none. */
export interface FunnelRequestRule {
  check(item: FunnelRequest): string[];
}

export class FunnelRequestAttemptsRangeRule implements FunnelRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelRequest): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FunnelRequestCodePrefixRule implements FunnelRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FunnelRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FunnelRequestVariantLengthRule implements FunnelRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelRequest): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelRequestTitleLengthRule implements FunnelRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelRequest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelRequestRequiredOwnerIdRule implements FunnelRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelRequest): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a funnel request. */
export class FunnelRequestValidator {
  rules: FunnelRequestRule[];

  constructor(rules: FunnelRequestRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelRequest): string[] {
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

  requireValid(item: FunnelRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelRequest[]): Map<string, string[]> {
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

export function defaultFunnelRequestValidator(): FunnelRequestValidator {
  return new FunnelRequestValidator(
    [
      new FunnelRequestAttemptsRangeRule(80, 120),
      new FunnelRequestCodePrefixRule("OPS"),
      new FunnelRequestVariantLengthRule(255),
      new FunnelRequestTitleLengthRule(16),
      new FunnelRequestRequiredOwnerIdRule("funnel request needs an entry"),
    ],
  );
}
