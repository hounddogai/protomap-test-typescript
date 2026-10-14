import { TieredTicketViewClaim } from "./tiered-ticket-view-claim.js";

/** A rule a tiered ticket view claim must pass. Check returns its problems, or none. */
export interface TieredTicketViewClaimRule {
  check(item: TieredTicketViewClaim): string[];
}

export class TieredTicketViewClaimRequiredTitleRule implements TieredTicketViewClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTicketViewClaim): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTicketViewClaimTitleLengthRule implements TieredTicketViewClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTicketViewClaim): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredTicketViewClaimRequiredUnitRule implements TieredTicketViewClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTicketViewClaim): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTicketViewClaimCodeLengthRule implements TieredTicketViewClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTicketViewClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredTicketViewClaimCodePrefixRule implements TieredTicketViewClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredTicketViewClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered ticket view claim. */
export class TieredTicketViewClaimValidator {
  rules: TieredTicketViewClaimRule[];

  constructor(rules: TieredTicketViewClaimRule[]) {
    this.rules = rules;
  }

  validate(item: TieredTicketViewClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredTicketViewClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredTicketViewClaim[]): Map<string, string[]> {
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

export function defaultTieredTicketViewClaimValidator(): TieredTicketViewClaimValidator {
  return new TieredTicketViewClaimValidator(
    [
      new TieredTicketViewClaimRequiredTitleRule("tiered ticket view claim needs a value"),
      new TieredTicketViewClaimTitleLengthRule(255),
      new TieredTicketViewClaimRequiredUnitRule("tiered ticket view claim needs a value"),
      new TieredTicketViewClaimCodeLengthRule(1000),
      new TieredTicketViewClaimCodePrefixRule("Q"),
    ],
  );
}
