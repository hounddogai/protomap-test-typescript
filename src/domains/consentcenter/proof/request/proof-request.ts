/**
 * The proof request records of consentcenter's proof work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a proof request is in its life cycle. */
export type ProofRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A proof request as the proof team keeps it. */
export class ProofRequest {
  code: string;
  label: string;
  region: string;
  impressions: number;
  ceiling: number;
  limit: number;
  capacity: number;
  checksum: string;
  conversionRate: number;
  segment: string;
  status: ProofRequestStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    impressions: number,
    ceiling: number,
    limit: number,
    capacity: number,
    checksum: string,
    conversionRate: number,
    segment: string,
    status: ProofRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.impressions = impressions;
    this.ceiling = ceiling;
    this.limit = limit;
    this.capacity = capacity;
    this.checksum = checksum;
    this.conversionRate = conversionRate;
    this.segment = segment;
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

  canMoveTo(next: ProofRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ProofRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedVolume(): number {
    return Math.round(this.ceiling * this.limit * 100) / 100;
  }

  copy(): ProofRequest {
    return new ProofRequest(
      this.code,
      this.label,
      this.region,
      this.impressions,
      this.ceiling,
      this.limit,
      this.capacity,
      this.checksum,
      this.conversionRate,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a proof request in status draft. */
export function newProofRequest(code: string, label: string): ProofRequest {
  return new ProofRequest(code, label, "", 0, 0, 0, 0, "", 0, "", "draft");
}
