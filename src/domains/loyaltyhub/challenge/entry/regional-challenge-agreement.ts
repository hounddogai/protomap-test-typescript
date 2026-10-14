import * as text from "../../../../kit/text.js";

/** Where a regional challenge agreement is in its life cycle. */
export type RegionalChallengeAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A regional challenge agreement as the challenge team keeps it. */
export class RegionalChallengeAgreement {
  code: string;
  name: string;
  variant: string;
  campaignRef: string;
  country: string;
  durationMinutes: number;
  attributes: Map<string, string>;
  status: RegionalChallengeAgreementStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    campaignRef: string,
    country: string,
    durationMinutes: number,
    attributes: Map<string, string>,
    status: RegionalChallengeAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.campaignRef = campaignRef;
    this.country = country;
    this.durationMinutes = durationMinutes;
    this.attributes = attributes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalChallengeAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RegionalChallengeAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional challenge agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): RegionalChallengeAgreement {
    return new RegionalChallengeAgreement(
      this.code,
      this.name,
      this.variant,
      this.campaignRef,
      this.country,
      this.durationMinutes,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a regional challenge agreement in status planned. */
export function newRegionalChallengeAgreement(code: string, name: string): RegionalChallengeAgreement {
  return new RegionalChallengeAgreement(code, name, "", "", "", 0, new Map<string, string>(), "planned");
}
