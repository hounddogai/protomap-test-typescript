import * as text from "../../../../kit/text.js";

/** Where a global post rollup is in its life cycle. */
export type GlobalPostRollupStatus = "requested" | "granted" | "revoked" | "expired";

/** A global post rollup as the post team keeps it. */
export class GlobalPostRollup {
  code: string;
  label: string;
  name: string;
  pinned: boolean;
  segment: string;
  quantity: number;
  createdAt: number;
  updatedAt: number;
  impressions: number;
  status: GlobalPostRollupStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    pinned: boolean,
    segment: string,
    quantity: number,
    createdAt: number,
    updatedAt: number,
    impressions: number,
    status: GlobalPostRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.pinned = pinned;
    this.segment = segment;
    this.quantity = quantity;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.impressions = impressions;
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

  canMoveTo(next: GlobalPostRollupStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalPostRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global post rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netExposure(): number {
    return Math.round((this.updatedAt - this.createdAt) * 100) / 100;
  }

  copy(): GlobalPostRollup {
    return new GlobalPostRollup(
      this.code,
      this.label,
      this.name,
      this.pinned,
      this.segment,
      this.quantity,
      this.createdAt,
      this.updatedAt,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a global post rollup in status requested. */
export function newGlobalPostRollup(code: string, label: string): GlobalPostRollup {
  return new GlobalPostRollup(code, label, "", false, "", 0, 0, 0, 0, "requested");
}
