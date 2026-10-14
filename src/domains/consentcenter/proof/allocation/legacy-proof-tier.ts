import * as text from "../../../../kit/text.js";

/** Where a legacy proof tier is in its life cycle. */
export type LegacyProofTierStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a legacy proof tier and its current status. */
export class LegacyProofTier {
  code: string;
  label: string;
  archived: boolean;
  checksum: string;
  bid: number;
  margin: number;
  summary: string;
  startsAt: number;
  batchSize: number;
  status: LegacyProofTierStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    checksum: string,
    bid: number,
    margin: number,
    summary: string,
    startsAt: number,
    batchSize: number,
    status: LegacyProofTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.checksum = checksum;
    this.bid = bid;
    this.margin = margin;
    this.summary = summary;
    this.startsAt = startsAt;
    this.batchSize = batchSize;
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

  canMoveTo(next: LegacyProofTierStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
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

  moveTo(next: LegacyProofTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy proof tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedValue(): number {
    return Math.round((this.startsAt - this.batchSize) * 100) / 100;
  }

  copy(): LegacyProofTier {
    return new LegacyProofTier(
      this.code,
      this.label,
      this.archived,
      this.checksum,
      this.bid,
      this.margin,
      this.summary,
      this.startsAt,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy proof tier in status requested. */
export function newLegacyProofTier(code: string, label: string): LegacyProofTier {
  return new LegacyProofTier(code, label, false, "", 0, 0, "", 0, 0, "requested");
}
