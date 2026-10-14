import * as text from "../../../../kit/text.js";

/** Where a strict level notice is in its life cycle. */
export type StrictLevelNoticeStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict level notice as the level team keeps it. */
export class StrictLevelNotice {
  code: string;
  label: string;
  approved: boolean;
  ratio: number;
  reviewer: string;
  expiresAt: number;
  quantity: number;
  phone: string;
  visible: boolean;
  status: StrictLevelNoticeStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    ratio: number,
    reviewer: string,
    expiresAt: number,
    quantity: number,
    phone: string,
    visible: boolean,
    status: StrictLevelNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.ratio = ratio;
    this.reviewer = reviewer;
    this.expiresAt = expiresAt;
    this.quantity = quantity;
    this.phone = phone;
    this.visible = visible;
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

  canMoveTo(next: StrictLevelNoticeStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictLevelNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict level notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netTotal(): number {
    return Math.round((this.ratio + this.quantity) * 100) / 100;
  }

  copy(): StrictLevelNotice {
    return new StrictLevelNotice(
      this.code,
      this.label,
      this.approved,
      this.ratio,
      this.reviewer,
      this.expiresAt,
      this.quantity,
      this.phone,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict level notice in status requested. */
export function newStrictLevelNotice(code: string, label: string): StrictLevelNotice {
  return new StrictLevelNotice(code, label, false, 0, "", 0, 0, "", false, "requested");
}
