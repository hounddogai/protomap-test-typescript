import * as text from "../../../../kit/text.js";

/** Where a manual proof quota is in its life cycle. */
export type ManualProofQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** A manual proof quota. Its code is unique within a tenant. */
export class ManualProofQuota {
  code: string;
  label: string;
  clicks: number;
  margin: number;
  floorValue: number;
  discount: number;
  channel: string;
  status: ManualProofQuotaStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    margin: number,
    floorValue: number,
    discount: number,
    channel: string,
    status: ManualProofQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.margin = margin;
    this.floorValue = floorValue;
    this.discount = discount;
    this.channel = channel;
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

  canMoveTo(next: ManualProofQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualProofQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual proof quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"manual proof quota"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.discount + this.floorValue) * 100) / 100;
  }

  copy(): ManualProofQuota {
    return new ManualProofQuota(
      this.code,
      this.label,
      this.clicks,
      this.margin,
      this.floorValue,
      this.discount,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual proof quota in status new. */
export function newManualProofQuota(code: string, label: string): ManualProofQuota {
  return new ManualProofQuota(code, label, 0, 0, 0, 0, "", "new");
}
