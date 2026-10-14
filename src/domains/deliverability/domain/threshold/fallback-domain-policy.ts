import * as text from "../../../../kit/text.js";

/** Where a fallback domain policy is in its life cycle. */
export type FallbackDomainPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One fallback domain policy, with what the planners need to act on it. */
export class FallbackDomainPolicy {
  code: string;
  name: string;
  attempts: number;
  archived: boolean;
  checksum: string;
  startsAt: number;
  campaignRef: string;
  status: FallbackDomainPolicyStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    archived: boolean,
    checksum: string,
    startsAt: number,
    campaignRef: string,
    status: FallbackDomainPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.archived = archived;
    this.checksum = checksum;
    this.startsAt = startsAt;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackDomainPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FallbackDomainPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback domain policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.attempts + this.startsAt) * 100) / 100;
  }

  copy(): FallbackDomainPolicy {
    return new FallbackDomainPolicy(
      this.code,
      this.name,
      this.attempts,
      this.archived,
      this.checksum,
      this.startsAt,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback domain policy in status proposed. */
export function newFallbackDomainPolicy(code: string, name: string): FallbackDomainPolicy {
  return new FallbackDomainPolicy(code, name, 0, false, "", 0, "", "proposed");
}
