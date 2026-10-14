import * as text from "../../../../kit/text.js";

/** Where a paywall notice is in its life cycle. */
export type PaywallNoticeStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A paywall notice. Its code is unique within a tenant. */
export class PaywallNotice {
  code: string;
  label: string;
  notes: string;
  ratio: number;
  updatedAt: number;
  endsAt: number;
  pinned: boolean;
  version: number;
  capacity: number;
  title: string;
  status: PaywallNoticeStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    ratio: number,
    updatedAt: number,
    endsAt: number,
    pinned: boolean,
    version: number,
    capacity: number,
    title: string,
    status: PaywallNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.ratio = ratio;
    this.updatedAt = updatedAt;
    this.endsAt = endsAt;
    this.pinned = pinned;
    this.version = version;
    this.capacity = capacity;
    this.title = title;
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

  canMoveTo(next: PaywallNoticeStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PaywallNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedVolume(): number {
    return Math.round(this.endsAt * this.capacity * 100) / 100;
  }

  copy(): PaywallNotice {
    return new PaywallNotice(
      this.code,
      this.label,
      this.notes,
      this.ratio,
      this.updatedAt,
      this.endsAt,
      this.pinned,
      this.version,
      this.capacity,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a paywall notice in status draft. */
export function newPaywallNotice(code: string, label: string): PaywallNotice {
  return new PaywallNotice(code, label, "", 0, 0, 0, false, 0, 0, "", "draft");
}
