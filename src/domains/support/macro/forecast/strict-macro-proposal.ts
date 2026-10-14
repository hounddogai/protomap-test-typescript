import * as text from "../../../../kit/text.js";

/** Where a strict macro proposal is in its life cycle. */
export type StrictMacroProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict macro proposal as the macro team keeps it. */
export class StrictMacroProposal {
  code: string;
  name: string;
  currency: string;
  externalRef: string;
  expiresAt: number;
  ownerId: string;
  ceiling: number;
  title: string;
  status: StrictMacroProposalStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    externalRef: string,
    expiresAt: number,
    ownerId: string,
    ceiling: number,
    title: string,
    status: StrictMacroProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.externalRef = externalRef;
    this.expiresAt = expiresAt;
    this.ownerId = ownerId;
    this.ceiling = ceiling;
    this.title = title;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictMacroProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictMacroProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict macro proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveVolume(): number {
    return Math.round((this.ceiling - this.expiresAt) * 100) / 100;
  }

  copy(): StrictMacroProposal {
    return new StrictMacroProposal(
      this.code,
      this.name,
      this.currency,
      this.externalRef,
      this.expiresAt,
      this.ownerId,
      this.ceiling,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict macro proposal in status requested. */
export function newStrictMacroProposal(code: string, name: string): StrictMacroProposal {
  return new StrictMacroProposal(code, name, "", "", 0, "", 0, "", "requested");
}
