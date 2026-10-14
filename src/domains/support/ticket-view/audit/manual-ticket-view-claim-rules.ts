import { ManualTicketViewClaim } from "./manual-ticket-view-claim.js";

/** A rule a manual ticket view claim must pass. Check returns its problems, or none. */
export interface ManualTicketViewClaimRule {
  check(item: ManualTicketViewClaim): string[];
}

export class ManualTicketViewClaimRequiredNameRule implements ManualTicketViewClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTicketViewClaim): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTicketViewClaimCodePrefixRule implements ManualTicketViewClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualTicketViewClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualTicketViewClaimContactEmailLengthRule implements ManualTicketViewClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTicketViewClaim): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualTicketViewClaimVisibleGuardRule implements ManualTicketViewClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ManualTicketViewClaim): string[] {
    if (item.visible && item.endsAt > this.limit) return [`ends at ${item.endsAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class ManualTicketViewClaimTitleLengthRule implements ManualTicketViewClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTicketViewClaim): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual ticket view claim. */
export class ManualTicketViewClaimValidator {
  rules: ManualTicketViewClaimRule[];

  constructor(rules: ManualTicketViewClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTicketViewClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualTicketViewClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTicketViewClaim[]): Map<string, string[]> {
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

export function defaultManualTicketViewClaimValidator(): ManualTicketViewClaimValidator {
  return new ManualTicketViewClaimValidator(
    [
      new ManualTicketViewClaimRequiredNameRule("manual ticket view claim needs this field"),
      new ManualTicketViewClaimCodePrefixRule("REF"),
      new ManualTicketViewClaimContactEmailLengthRule(120),
      new ManualTicketViewClaimVisibleGuardRule(32),
      new ManualTicketViewClaimTitleLengthRule(80),
    ],
  );
}
