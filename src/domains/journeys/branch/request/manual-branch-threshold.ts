import * as text from "../../../../kit/text.js";

/** Where a manual branch threshold is in its life cycle. */
export type ManualBranchThresholdStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A manual branch threshold. Its code is unique within a tenant. */
export class ManualBranchThreshold {
  code: string;
  name: string;
  expiresAt: number;
  notes: string;
  externalRef: string;
  pinned: boolean;
  summary: string;
  quantity: number;
  campaignRef: string;
  status: ManualBranchThresholdStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    notes: string,
    externalRef: string,
    pinned: boolean,
    summary: string,
    quantity: number,
    campaignRef: string,
    status: ManualBranchThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.notes = notes;
    this.externalRef = externalRef;
    this.pinned = pinned;
    this.summary = summary;
    this.quantity = quantity;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: ManualBranchThresholdStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualBranchThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual branch threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"manual branch threshold"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.quantity * this.expiresAt * 100) / 100;
  }

  copy(): ManualBranchThreshold {
    return new ManualBranchThreshold(
      this.code,
      this.name,
      this.expiresAt,
      this.notes,
      this.externalRef,
      this.pinned,
      this.summary,
      this.quantity,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual branch threshold in status open. */
export function newManualBranchThreshold(code: string, name: string): ManualBranchThreshold {
  return new ManualBranchThreshold(code, name, 0, "", "", false, "", 0, "", "open");
}
