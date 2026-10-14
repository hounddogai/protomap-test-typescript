import * as text from "../../../../kit/text.js";

/** Where a default redemption reservation is in its life cycle. */
export type DefaultRedemptionReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A default redemption reservation as the redemption team keeps it. */
export class DefaultRedemptionReservation {
  code: string;
  label: string;
  retries: number;
  weight: number;
  sendAt: number;
  archived: boolean;
  discount: number;
  updatedAt: number;
  status: DefaultRedemptionReservationStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    weight: number,
    sendAt: number,
    archived: boolean,
    discount: number,
    updatedAt: number,
    status: DefaultRedemptionReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.weight = weight;
    this.sendAt = sendAt;
    this.archived = archived;
    this.discount = discount;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultRedemptionReservationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: DefaultRedemptionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default redemption reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveVolume(): number {
    return Math.round((this.weight - this.discount) * 100) / 100;
  }

  copy(): DefaultRedemptionReservation {
    return new DefaultRedemptionReservation(
      this.code,
      this.label,
      this.retries,
      this.weight,
      this.sendAt,
      this.archived,
      this.discount,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default redemption reservation in status new. */
export function newDefaultRedemptionReservation(code: string, label: string): DefaultRedemptionReservation {
  return new DefaultRedemptionReservation(code, label, 0, 0, 0, false, 0, 0, "new");
}
