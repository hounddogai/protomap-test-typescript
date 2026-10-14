/**
 * The csat manifest records of support's csat work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a csat manifest is in its life cycle. */
export type CsatManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a csat manifest and its current status. */
export class CsatManifest {
  code: string;
  label: string;
  updatedAt: number;
  reviewer: string;
  notes: string;
  margin: number;
  sendAt: number;
  frequencyCap: number;
  batchSize: number;
  status: CsatManifestStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    reviewer: string,
    notes: string,
    margin: number,
    sendAt: number,
    frequencyCap: number,
    batchSize: number,
    status: CsatManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.reviewer = reviewer;
    this.notes = notes;
    this.margin = margin;
    this.sendAt = sendAt;
    this.frequencyCap = frequencyCap;
    this.batchSize = batchSize;
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

  canMoveTo(next: CsatManifestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "running";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CsatManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"csat manifest"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.frequencyCap * this.margin * 100) / 100;
  }

  copy(): CsatManifest {
    return new CsatManifest(
      this.code,
      this.label,
      this.updatedAt,
      this.reviewer,
      this.notes,
      this.margin,
      this.sendAt,
      this.frequencyCap,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a csat manifest in status new. */
export function newCsatManifest(code: string, label: string): CsatManifest {
  return new CsatManifest(code, label, 0, "", "", 0, 0, 0, 0, "new");
}
