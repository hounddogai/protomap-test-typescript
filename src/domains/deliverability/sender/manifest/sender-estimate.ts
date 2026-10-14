import * as text from "../../../../kit/text.js";

/** Where a sender estimate is in its life cycle. */
export type SenderEstimateStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a sender estimate and its current status. */
export class SenderEstimate {
  code: string;
  label: string;
  campaignRef: string;
  summary: string;
  description: string;
  clicks: number;
  ceiling: number;
  updatedAt: number;
  status: SenderEstimateStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    summary: string,
    description: string,
    clicks: number,
    ceiling: number,
    updatedAt: number,
    status: SenderEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.summary = summary;
    this.description = description;
    this.clicks = clicks;
    this.ceiling = ceiling;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: SenderEstimateStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
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

  moveTo(next: SenderEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedValue(): number {
    return Math.round(this.ceiling * this.clicks * 100) / 100;
  }

  copy(): SenderEstimate {
    return new SenderEstimate(
      this.code,
      this.label,
      this.campaignRef,
      this.summary,
      this.description,
      this.clicks,
      this.ceiling,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a sender estimate in status requested. */
export function newSenderEstimate(code: string, label: string): SenderEstimate {
  return new SenderEstimate(code, label, "", "", "", 0, 0, 0, "requested");
}
