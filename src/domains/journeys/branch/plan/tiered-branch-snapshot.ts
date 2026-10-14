import * as text from "../../../../kit/text.js";

/** Where a tiered branch snapshot is in its life cycle. */
export type TieredBranchSnapshotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A tiered branch snapshot. Its code is unique within a tenant. */
export class TieredBranchSnapshot {
  code: string;
  label: string;
  title: string;
  ownerId: string;
  expiresAt: number;
  status: TieredBranchSnapshotStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    ownerId: string,
    expiresAt: number,
    status: TieredBranchSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.ownerId = ownerId;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredBranchSnapshotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: TieredBranchSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered branch snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.expiresAt;
  }

  copy(): TieredBranchSnapshot {
    return new TieredBranchSnapshot(this.code, this.label, this.title, this.ownerId, this.expiresAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered branch snapshot in status open. */
export function newTieredBranchSnapshot(code: string, label: string): TieredBranchSnapshot {
  return new TieredBranchSnapshot(code, label, "", "", 0, "open");
}
