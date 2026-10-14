/**
 * The proof record records of consentcenter's proof work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a proof record is in its life cycle. */
export type ProofRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a proof record and its current status. */
export class ProofRecord {
  code: string;
  label: string;
  impressions: number;
  revision: number;
  visible: boolean;
  openRate: number;
  ratio: number;
  minimum: number;
  durationMinutes: number;
  capacity: number;
  country: string;
  status: ProofRecordStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    revision: number,
    visible: boolean,
    openRate: number,
    ratio: number,
    minimum: number,
    durationMinutes: number,
    capacity: number,
    country: string,
    status: ProofRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.revision = revision;
    this.visible = visible;
    this.openRate = openRate;
    this.ratio = ratio;
    this.minimum = minimum;
    this.durationMinutes = durationMinutes;
    this.capacity = capacity;
    this.country = country;
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

  canMoveTo(next: ProofRecordStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ProofRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round((this.minimum + this.capacity) * 100) / 100;
  }

  copy(): ProofRecord {
    return new ProofRecord(
      this.code,
      this.label,
      this.impressions,
      this.revision,
      this.visible,
      this.openRate,
      this.ratio,
      this.minimum,
      this.durationMinutes,
      this.capacity,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a proof record in status requested. */
export function newProofRecord(code: string, label: string): ProofRecord {
  return new ProofRecord(code, label, 0, 0, false, 0, 0, 0, 0, 0, "", "requested");
}
