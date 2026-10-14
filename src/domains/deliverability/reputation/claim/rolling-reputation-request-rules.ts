import { RollingReputationRequest } from "./rolling-reputation-request.js";

/** A rule a rolling reputation request must pass. Check returns its problems, or none. */
export interface RollingReputationRequestRule {
  check(item: RollingReputationRequest): string[];
}

export class RollingReputationRequestCodePrefixRule implements RollingReputationRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingReputationRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingReputationRequestArchivedGuardRule implements RollingReputationRequestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingReputationRequest): string[] {
    if (item.archived && item.discount > this.limit) return [`discount ${item.discount} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class RollingReputationRequestRequiredCountryRule implements RollingReputationRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingReputationRequest): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling reputation request. */
export class RollingReputationRequestValidator {
  rules: RollingReputationRequestRule[];

  constructor(rules: RollingReputationRequestRule[]) {
    this.rules = rules;
  }

  validate(item: RollingReputationRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingReputationRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingReputationRequest[]): Map<string, string[]> {
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

export function defaultRollingReputationRequestValidator(): RollingReputationRequestValidator {
  return new RollingReputationRequestValidator(
    [
      new RollingReputationRequestCodePrefixRule("Q"),
      new RollingReputationRequestArchivedGuardRule(9.7),
      new RollingReputationRequestRequiredCountryRule("rolling reputation request needs a value"),
    ],
  );
}
