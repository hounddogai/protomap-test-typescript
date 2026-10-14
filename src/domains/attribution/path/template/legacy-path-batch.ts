import * as text from "../../../../kit/text.js";

/** Where a legacy path batch is in its life cycle. */
export type LegacyPathBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a legacy path batch and its current status. */
export class LegacyPathBatch {
  code: string;
  name: string;
  graceDays: number;
  openRate: number;
  reviewer: string;
  archived: boolean;
  frequencyCap: number;
  segment: string;
  status: LegacyPathBatchStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    openRate: number,
    reviewer: string,
    archived: boolean,
    frequencyCap: number,
    segment: string,
    status: LegacyPathBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.openRate = openRate;
    this.reviewer = reviewer;
    this.archived = archived;
    this.frequencyCap = frequencyCap;
    this.segment = segment;
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

  canMoveTo(next: LegacyPathBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LegacyPathBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy path batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveLoad(): number {
    return Math.round((this.frequencyCap + this.graceDays) * 100) / 100;
  }

  copy(): LegacyPathBatch {
    return new LegacyPathBatch(
      this.code,
      this.name,
      this.graceDays,
      this.openRate,
      this.reviewer,
      this.archived,
      this.frequencyCap,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a legacy path batch in status requested. */
export function newLegacyPathBatch(code: string, name: string): LegacyPathBatch {
  return new LegacyPathBatch(code, name, 0, 0, "", false, 0, "", "requested");
}
