import * as text from "../../../../kit/text.js";

/** Where a lenient level proposal is in its life cycle. */
export type LenientLevelProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** A lenient level proposal as the level team keeps it. */
export class LenientLevelProposal {
  code: string;
  label: string;
  discount: number;
  startsAt: number;
  windowDays: number;
  ceiling: number;
  visible: boolean;
  description: string;
  expiresAt: number;
  phone: string;
  status: LenientLevelProposalStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    startsAt: number,
    windowDays: number,
    ceiling: number,
    visible: boolean,
    description: string,
    expiresAt: number,
    phone: string,
    status: LenientLevelProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.startsAt = startsAt;
    this.windowDays = windowDays;
    this.ceiling = ceiling;
    this.visible = visible;
    this.description = description;
    this.expiresAt = expiresAt;
    this.phone = phone;
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

  canMoveTo(next: LenientLevelProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
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

  moveTo(next: LenientLevelProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient level proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedTotal(): number {
    return Math.round((this.expiresAt + this.windowDays) * 100) / 100;
  }

  copy(): LenientLevelProposal {
    return new LenientLevelProposal(
      this.code,
      this.label,
      this.discount,
      this.startsAt,
      this.windowDays,
      this.ceiling,
      this.visible,
      this.description,
      this.expiresAt,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient level proposal in status requested. */
export function newLenientLevelProposal(code: string, label: string): LenientLevelProposal {
  return new LenientLevelProposal(code, label, 0, 0, 0, 0, false, "", 0, "", "requested");
}
