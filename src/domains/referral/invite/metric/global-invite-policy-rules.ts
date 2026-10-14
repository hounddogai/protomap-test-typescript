import { GlobalInvitePolicy } from "./global-invite-policy.js";

/** A rule a global invite policy must pass. Check returns its problems, or none. */
export interface GlobalInvitePolicyRule {
  check(item: GlobalInvitePolicy): string[];
}

export class GlobalInvitePolicyRequiredCampaignRefRule implements GlobalInvitePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalInvitePolicy): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalInvitePolicyRequiredAudienceIdRule implements GlobalInvitePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalInvitePolicy): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalInvitePolicyCodePrefixRule implements GlobalInvitePolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalInvitePolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a global invite policy. */
export class GlobalInvitePolicyValidator {
  rules: GlobalInvitePolicyRule[];

  constructor(rules: GlobalInvitePolicyRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalInvitePolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalInvitePolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalInvitePolicy[]): Map<string, string[]> {
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

export function defaultGlobalInvitePolicyValidator(): GlobalInvitePolicyValidator {
  return new GlobalInvitePolicyValidator(
    [
      new GlobalInvitePolicyRequiredCampaignRefRule("global invite policy needs a value"),
      new GlobalInvitePolicyRequiredAudienceIdRule("global invite policy needs this field"),
      new GlobalInvitePolicyCodePrefixRule("REF"),
    ],
  );
}
