import * as text from "../../../../kit/text.js";

/** Where a payout reservation is in its life cycle. */
export type PayoutReservationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A payout reservation. Its code is unique within a tenant. */
export class PayoutReservation {
  code: string;
  title: string;
  createdAt: number;
  ceiling: number;
  visible: boolean;
  locale: string;
  audienceId: string;
  phone: string;
  impressions: number;
  limit: number;
  status: PayoutReservationStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    ceiling: number,
    visible: boolean,
    locale: string,
    audienceId: string,
    phone: string,
    impressions: number,
    limit: number,
    status: PayoutReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.ceiling = ceiling;
    this.visible = visible;
    this.locale = locale;
    this.audienceId = audienceId;
    this.phone = phone;
    this.impressions = impressions;
    this.limit = limit;
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

  canMoveTo(next: PayoutReservationStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveLoad(): number {
    return Math.round(this.ceiling * this.createdAt * 100) / 100;
  }

  copy(): PayoutReservation {
    return new PayoutReservation(
      this.code,
      this.title,
      this.createdAt,
      this.ceiling,
      this.visible,
      this.locale,
      this.audienceId,
      this.phone,
      this.impressions,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a payout reservation in status draft. */
export function newPayoutReservation(code: string, title: string): PayoutReservation {
  return new PayoutReservation(code, title, 0, 0, false, "", "", "", 0, 0, "draft");
}
