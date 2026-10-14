import * as text from "../../../../kit/text.js";

/** Where a approval estimate is in its life cycle. */
export type ApprovalEstimateStatus = "requested" | "granted" | "revoked" | "expired";

/** A approval estimate. Its code is unique within a tenant. */
export class ApprovalEstimate {
  code: string;
  name: string;
  ceiling: number;
  clicks: number;
  segment: string;
  discount: number;
  channel: string;
  notes: string;
  status: ApprovalEstimateStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    clicks: number,
    segment: string,
    discount: number,
    channel: string,
    notes: string,
    status: ApprovalEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.clicks = clicks;
    this.segment = segment;
    this.discount = discount;
    this.channel = channel;
    this.notes = notes;
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

  canMoveTo(next: ApprovalEstimateStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ApprovalEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveVolume(): number {
    return Math.round(this.discount * this.clicks * 100) / 100;
  }

  copy(): ApprovalEstimate {
    return new ApprovalEstimate(
      this.code,
      this.name,
      this.ceiling,
      this.clicks,
      this.segment,
      this.discount,
      this.channel,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a approval estimate in status requested. */
export function newApprovalEstimate(code: string, name: string): ApprovalEstimate {
  return new ApprovalEstimate(code, name, 0, 0, "", 0, "", "", "requested");
}
