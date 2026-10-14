import * as text from "../../../../kit/text.js";

/** Where a challenge agreement is in its life cycle. */
export type ChallengeAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A challenge agreement as the challenge team keeps it. */
export class ChallengeAgreement {
  code: string;
  name: string;
  region: string;
  country: string;
  audienceId: string;
  sequence: number;
  openRate: number;
  status: ChallengeAgreementStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    country: string,
    audienceId: string,
    sequence: number,
    openRate: number,
    status: ChallengeAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.country = country;
    this.audienceId = audienceId;
    this.sequence = sequence;
    this.openRate = openRate;
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

  canMoveTo(next: ChallengeAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
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

  moveTo(next: ChallengeAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedTotal(): number {
    return Math.round((this.sequence + this.openRate) * 100) / 100;
  }

  copy(): ChallengeAgreement {
    return new ChallengeAgreement(
      this.code,
      this.name,
      this.region,
      this.country,
      this.audienceId,
      this.sequence,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a challenge agreement in status proposed. */
export function newChallengeAgreement(code: string, name: string): ChallengeAgreement {
  return new ChallengeAgreement(code, name, "", "", "", 0, 0, "proposed");
}
