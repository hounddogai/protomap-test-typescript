import * as text from "../../../../kit/text.js";

/** Where a strict branch manifest is in its life cycle. */
export type StrictBranchManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A strict branch manifest as the branch team keeps it. */
export class StrictBranchManifest {
  code: string;
  name: string;
  channel: string;
  expiresAt: number;
  discount: number;
  label: string;
  status: StrictBranchManifestStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    expiresAt: number,
    discount: number,
    label: string,
    status: StrictBranchManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.discount = discount;
    this.label = label;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictBranchManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictBranchManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict branch manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveVolume(): number {
    return Math.round((this.discount - this.expiresAt) * 100) / 100;
  }

  copy(): StrictBranchManifest {
    return new StrictBranchManifest(
      this.code,
      this.name,
      this.channel,
      this.expiresAt,
      this.discount,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict branch manifest in status planned. */
export function newStrictBranchManifest(code: string, name: string): StrictBranchManifest {
  return new StrictBranchManifest(code, name, "", 0, 0, "", "planned");
}
