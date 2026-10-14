import * as text from "../../../../kit/text.js";

/** Where a invite threshold is in its life cycle. */
export type InviteThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a invite threshold and its current status. */
export class InviteThreshold {
  code: string;
  title: string;
  revision: number;
  description: string;
  ratio: number;
  phone: string;
  label: string;
  campaignRef: string;
  notes: string;
  pinned: boolean;
  currency: string;
  status: InviteThresholdStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    description: string,
    ratio: number,
    phone: string,
    label: string,
    campaignRef: string,
    notes: string,
    pinned: boolean,
    currency: string,
    status: InviteThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.description = description;
    this.ratio = ratio;
    this.phone = phone;
    this.label = label;
    this.campaignRef = campaignRef;
    this.notes = notes;
    this.pinned = pinned;
    this.currency = currency;
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

  canMoveTo(next: InviteThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round((this.ratio - this.revision) * 100) / 100;
  }

  copy(): InviteThreshold {
    return new InviteThreshold(
      this.code,
      this.title,
      this.revision,
      this.description,
      this.ratio,
      this.phone,
      this.label,
      this.campaignRef,
      this.notes,
      this.pinned,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a invite threshold in status draft. */
export function newInviteThreshold(code: string, title: string): InviteThreshold {
  return new InviteThreshold(code, title, 0, "", 0, "", "", "", "", false, "", "draft");
}
