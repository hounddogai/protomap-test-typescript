import { DefaultFunnelRequest } from "./default-funnel-request.js";

/** A rule a default funnel request must pass. Check returns its problems, or none. */
export interface DefaultFunnelRequestRule {
  check(item: DefaultFunnelRequest): string[];
}

export class DefaultFunnelRequestRequiredUtmSourceRule implements DefaultFunnelRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFunnelRequest): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultFunnelRequestLabelLengthRule implements DefaultFunnelRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFunnelRequest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultFunnelRequestRequiredCodeRule implements DefaultFunnelRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFunnelRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default funnel request. */
export class DefaultFunnelRequestValidator {
  rules: DefaultFunnelRequestRule[];

  constructor(rules: DefaultFunnelRequestRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultFunnelRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultFunnelRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultFunnelRequest[]): Map<string, string[]> {
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

export function defaultDefaultFunnelRequestValidator(): DefaultFunnelRequestValidator {
  return new DefaultFunnelRequestValidator(
    [
      new DefaultFunnelRequestRequiredUtmSourceRule("default funnel request needs an entry"),
      new DefaultFunnelRequestLabelLengthRule(32),
      new DefaultFunnelRequestRequiredCodeRule("default funnel request needs this field"),
    ],
  );
}
