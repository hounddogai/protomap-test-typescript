import * as text from "../../../../kit/text.js";

/** Where a csat checkpoint is in its life cycle. */
export type CsatCheckpointStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a csat checkpoint and its current status. */
export class CsatCheckpoint {
  code: string;
  name: string;
  windowDays: number;
  campaignRef: string;
  quantity: number;
  margin: number;
  approved: boolean;
  rate: number;
  country: string;
  audienceId: string;
  status: CsatCheckpointStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    campaignRef: string,
    quantity: number,
    margin: number,
    approved: boolean,
    rate: number,
    country: string,
    audienceId: string,
    status: CsatCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.margin = margin;
    this.approved = approved;
    this.rate = rate;
    this.country = country;
    this.audienceId = audienceId;
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

  canMoveTo(next: CsatCheckpointStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CsatCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"csat checkpoint"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round(this.margin * this.quantity * 100) / 100;
  }

  copy(): CsatCheckpoint {
    return new CsatCheckpoint(
      this.code,
      this.name,
      this.windowDays,
      this.campaignRef,
      this.quantity,
      this.margin,
      this.approved,
      this.rate,
      this.country,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a csat checkpoint in status requested. */
export function newCsatCheckpoint(code: string, name: string): CsatCheckpoint {
  return new CsatCheckpoint(code, name, 0, "", 0, 0, false, 0, "", "", "requested");
}
