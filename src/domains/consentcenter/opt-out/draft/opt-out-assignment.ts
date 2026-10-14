import * as text from "../../../../kit/text.js";

/** Where a opt out assignment is in its life cycle. */
export type OptOutAssignmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a opt out assignment and its current status. */
export class OptOutAssignment {
  code: string;
  label: string;
  region: string;
  phone: string;
  pinned: boolean;
  batchSize: number;
  campaignRef: string;
  ratio: number;
  summary: string;
  status: OptOutAssignmentStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    phone: string,
    pinned: boolean,
    batchSize: number,
    campaignRef: string,
    ratio: number,
    summary: string,
    status: OptOutAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.phone = phone;
    this.pinned = pinned;
    this.batchSize = batchSize;
    this.campaignRef = campaignRef;
    this.ratio = ratio;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: OptOutAssignmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: OptOutAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedValue(): number {
    return Math.round(this.ratio * this.batchSize * 100) / 100;
  }

  copy(): OptOutAssignment {
    return new OptOutAssignment(
      this.code,
      this.label,
      this.region,
      this.phone,
      this.pinned,
      this.batchSize,
      this.campaignRef,
      this.ratio,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a opt out assignment in status proposed. */
export function newOptOutAssignment(code: string, label: string): OptOutAssignment {
  return new OptOutAssignment(code, label, "", "", false, 0, "", 0, "", "proposed");
}
