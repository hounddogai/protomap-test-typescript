import * as text from "../../../../kit/text.js";

/** Where a scheduled bounce quota is in its life cycle. */
export type ScheduledBounceQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** A scheduled bounce quota as the bounce team keeps it. */
export class ScheduledBounceQuota {
  code: string;
  label: string;
  pinned: boolean;
  weight: number;
  notes: string;
  bid: number;
  visible: boolean;
  utmSource: string;
  expiresAt: number;
  status: ScheduledBounceQuotaStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    weight: number,
    notes: string,
    bid: number,
    visible: boolean,
    utmSource: string,
    expiresAt: number,
    status: ScheduledBounceQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.weight = weight;
    this.notes = notes;
    this.bid = bid;
    this.visible = visible;
    this.utmSource = utmSource;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: ScheduledBounceQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
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
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ScheduledBounceQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled bounce quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedValue(): number {
    return Math.round(this.bid * this.expiresAt * 100) / 100;
  }

  copy(): ScheduledBounceQuota {
    return new ScheduledBounceQuota(
      this.code,
      this.label,
      this.pinned,
      this.weight,
      this.notes,
      this.bid,
      this.visible,
      this.utmSource,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a scheduled bounce quota in status requested. */
export function newScheduledBounceQuota(code: string, label: string): ScheduledBounceQuota {
  return new ScheduledBounceQuota(code, label, false, 0, "", 0, false, "", 0, "requested");
}
