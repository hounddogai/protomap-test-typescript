import { PayoutPolicy } from "./payout-policy.js";

/** A rule a payout policy must pass. Check returns its problems, or none. */
export interface PayoutPolicyRule {
  check(item: PayoutPolicy): string[];
}

export class PayoutPolicyRequiredCampaignRefRule implements PayoutPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutPolicy): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutPolicyCodePrefixRule implements PayoutPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PayoutPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PayoutPolicyRequiredCodeRule implements PayoutPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a payout policy. */
export class PayoutPolicyValidator {
  rules: PayoutPolicyRule[];

  constructor(rules: PayoutPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PayoutPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutPolicy[]): Map<string, string[]> {
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

export function defaultPayoutPolicyValidator(): PayoutPolicyValidator {
  return new PayoutPolicyValidator(
    [
      new PayoutPolicyRequiredCampaignRefRule("payout policy needs this field"),
      new PayoutPolicyCodePrefixRule("OPS"),
      new PayoutPolicyRequiredCodeRule("payout policy needs a value"),
    ],
  );
}
