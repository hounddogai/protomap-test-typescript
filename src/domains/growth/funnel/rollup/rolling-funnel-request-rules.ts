import * as text from "../../../../kit/text.js";
import { RollingFunnelRequest } from "./rolling-funnel-request.js";

/** A rule a rolling funnel request must pass. Check returns its problems, or none. */
export interface RollingFunnelRequestRule {
  check(item: RollingFunnelRequest): string[];
}

export class RollingFunnelRequestRegionLengthRule implements RollingFunnelRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingFunnelRequest): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingFunnelRequestAllowedTitleRule implements RollingFunnelRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingFunnelRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is inconsistent`];
    return [];
  }
}

export class RollingFunnelRequestRequiredRegionRule implements RollingFunnelRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingFunnelRequest): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class RollingFunnelRequestCodePrefixRule implements RollingFunnelRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingFunnelRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a rolling funnel request. */
export class RollingFunnelRequestValidator {
  rules: RollingFunnelRequestRule[];

  constructor(rules: RollingFunnelRequestRule[]) {
    this.rules = rules;
  }

  validate(item: RollingFunnelRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingFunnelRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingFunnelRequest[]): Map<string, string[]> {
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

export function defaultRollingFunnelRequestValidator(): RollingFunnelRequestValidator {
  return new RollingFunnelRequestValidator(
    [
      new RollingFunnelRequestRegionLengthRule(80),
      new RollingFunnelRequestAllowedTitleRule(["capped", "scheduled"]),
      new RollingFunnelRequestRequiredRegionRule("rolling funnel request needs an entry"),
      new RollingFunnelRequestCodePrefixRule("Q"),
    ],
  );
}
