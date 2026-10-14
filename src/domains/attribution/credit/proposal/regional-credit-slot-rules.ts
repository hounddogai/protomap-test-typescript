import { RegionalCreditSlot } from "./regional-credit-slot.js";

/** A rule a regional credit slot must pass. Check returns its problems, or none. */
export interface RegionalCreditSlotRule {
  check(item: RegionalCreditSlot): string[];
}

export class RegionalCreditSlotPinnedGuardRule implements RegionalCreditSlotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RegionalCreditSlot): string[] {
    if (item.pinned && item.clicks > this.limit) return [`clicks ${item.clicks} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class RegionalCreditSlotRequiredCampaignRefRule implements RegionalCreditSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCreditSlot): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalCreditSlotCountryLengthRule implements RegionalCreditSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalCreditSlot): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalCreditSlotCampaignRefLengthRule implements RegionalCreditSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalCreditSlot): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional credit slot. */
export class RegionalCreditSlotValidator {
  rules: RegionalCreditSlotRule[];

  constructor(rules: RegionalCreditSlotRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalCreditSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalCreditSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalCreditSlot[]): Map<string, string[]> {
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

export function defaultRegionalCreditSlotValidator(): RegionalCreditSlotValidator {
  return new RegionalCreditSlotValidator(
    [
      new RegionalCreditSlotPinnedGuardRule(3600),
      new RegionalCreditSlotRequiredCampaignRefRule("regional credit slot needs this field"),
      new RegionalCreditSlotCountryLengthRule(255),
      new RegionalCreditSlotCampaignRefLengthRule(86400),
    ],
  );
}
