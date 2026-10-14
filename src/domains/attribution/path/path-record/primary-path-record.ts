/**
 * The primary path record records of attribution's path work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary path record is in its life cycle. */
export type PrimaryPathRecordStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a primary path record and its current status. */
export class PrimaryPathRecord {
  code: string;
  label: string;
  sequence: number;
  impressions: number;
  expiresAt: number;
  cost: number;
  checksum: string;
  description: string;
  name: string;
  country: string;
  status: PrimaryPathRecordStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    impressions: number,
    expiresAt: number,
    cost: number,
    checksum: string,
    description: string,
    name: string,
    country: string,
    status: PrimaryPathRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.impressions = impressions;
    this.expiresAt = expiresAt;
    this.cost = cost;
    this.checksum = checksum;
    this.description = description;
    this.name = name;
    this.country = country;
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

  canMoveTo(next: PrimaryPathRecordStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PrimaryPathRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary path record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netLoad(): number {
    return Math.round((this.expiresAt + this.sequence) * 100) / 100;
  }

  copy(): PrimaryPathRecord {
    return new PrimaryPathRecord(
      this.code,
      this.label,
      this.sequence,
      this.impressions,
      this.expiresAt,
      this.cost,
      this.checksum,
      this.description,
      this.name,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a primary path record in status new. */
export function newPrimaryPathRecord(code: string, label: string): PrimaryPathRecord {
  return new PrimaryPathRecord(code, label, 0, 0, 0, 0, "", "", "", "", "new");
}
