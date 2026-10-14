import * as text from "../../../../kit/text.js";

/** Where a legacy proof claim is in its life cycle. */
export type LegacyProofClaimStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a legacy proof claim and its current status. */
export class LegacyProofClaim {
  code: string;
  name: string;
  audienceId: string;
  visible: boolean;
  notes: string;
  amount: number;
  status: LegacyProofClaimStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    visible: boolean,
    notes: string,
    amount: number,
    status: LegacyProofClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.visible = visible;
    this.notes = notes;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyProofClaimStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LegacyProofClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy proof claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy proof claim"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): LegacyProofClaim {
    return new LegacyProofClaim(
      this.code,
      this.name,
      this.audienceId,
      this.visible,
      this.notes,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy proof claim in status open. */
export function newLegacyProofClaim(code: string, name: string): LegacyProofClaim {
  return new LegacyProofClaim(code, name, "", false, "", 0, "open");
}
