import * as text from "../../../../kit/text.js";

/** Where a seasonal creative snapshot is in its life cycle. */
export type SeasonalCreativeSnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A seasonal creative snapshot. Its code is unique within a tenant. */
export class SeasonalCreativeSnapshot {
  code: string;
  title: string;
  segment: string;
  category: string;
  label: string;
  expiresAt: number;
  checksum: string;
  frequencyCap: number;
  ratio: number;
  status: SeasonalCreativeSnapshotStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    category: string,
    label: string,
    expiresAt: number,
    checksum: string,
    frequencyCap: number,
    ratio: number,
    status: SeasonalCreativeSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.category = category;
    this.label = label;
    this.expiresAt = expiresAt;
    this.checksum = checksum;
    this.frequencyCap = frequencyCap;
    this.ratio = ratio;
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

  canMoveTo(next: SeasonalCreativeSnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalCreativeSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal creative snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.expiresAt - this.frequencyCap) * 100) / 100;
  }

  copy(): SeasonalCreativeSnapshot {
    return new SeasonalCreativeSnapshot(
      this.code,
      this.title,
      this.segment,
      this.category,
      this.label,
      this.expiresAt,
      this.checksum,
      this.frequencyCap,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a seasonal creative snapshot in status proposed. */
export function newSeasonalCreativeSnapshot(code: string, title: string): SeasonalCreativeSnapshot {
  return new SeasonalCreativeSnapshot(code, title, "", "", "", 0, "", 0, 0, "proposed");
}
