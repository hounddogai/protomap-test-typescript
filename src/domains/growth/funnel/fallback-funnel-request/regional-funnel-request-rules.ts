import { RegionalFunnelRequest } from "./regional-funnel-request.js";

/** A rule a regional funnel request must pass. Check returns its problems, or none. */
export interface RegionalFunnelRequestRule {
  check(item: RegionalFunnelRequest): string[];
}

export class RegionalFunnelRequestSendAtRangeRule implements RegionalFunnelRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalFunnelRequest): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalFunnelRequestCodeLengthRule implements RegionalFunnelRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalFunnelRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalFunnelRequestTitleLengthRule implements RegionalFunnelRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalFunnelRequest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalFunnelRequestCodePrefixRule implements RegionalFunnelRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalFunnelRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalFunnelRequestRequiredCodeRule implements RegionalFunnelRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalFunnelRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional funnel request. */
export class RegionalFunnelRequestValidator {
  rules: RegionalFunnelRequestRule[];

  constructor(rules: RegionalFunnelRequestRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalFunnelRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalFunnelRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalFunnelRequest[]): Map<string, string[]> {
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

export function defaultRegionalFunnelRequestValidator(): RegionalFunnelRequestValidator {
  return new RegionalFunnelRequestValidator(
    [
      new RegionalFunnelRequestSendAtRangeRule(16, 255),
      new RegionalFunnelRequestCodeLengthRule(86400),
      new RegionalFunnelRequestTitleLengthRule(3600),
      new RegionalFunnelRequestCodePrefixRule("X"),
      new RegionalFunnelRequestRequiredCodeRule("regional funnel request needs an entry"),
    ],
  );
}
