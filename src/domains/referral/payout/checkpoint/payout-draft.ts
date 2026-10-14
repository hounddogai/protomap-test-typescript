import * as text from "../../../../kit/text.js";

/** Where a payout draft is in its life cycle. */
export type PayoutDraftStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A payout draft as the payout team keeps it. */
export class PayoutDraft {
  code: string;
  label: string;
  expiresAt: number;
  sendAt: number;
  name: string;
  impressions: number;
  journeyId: string;
  notes: string;
  amount: number;
  status: PayoutDraftStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    sendAt: number,
    name: string,
    impressions: number,
    journeyId: string,
    notes: string,
    amount: number,
    status: PayoutDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.sendAt = sendAt;
    this.name = name;
    this.impressions = impressions;
    this.journeyId = journeyId;
    this.notes = notes;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PayoutDraftStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PayoutDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedValue(): number {
    return Math.round(this.amount * this.impressions * 100) / 100;
  }

  copy(): PayoutDraft {
    return new PayoutDraft(
      this.code,
      this.label,
      this.expiresAt,
      this.sendAt,
      this.name,
      this.impressions,
      this.journeyId,
      this.notes,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a payout draft in status draft. */
export function newPayoutDraft(code: string, label: string): PayoutDraft {
  return new PayoutDraft(code, label, 0, 0, "", 0, "", "", 0, "draft");
}
