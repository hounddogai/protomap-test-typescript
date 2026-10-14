import * as text from "../../../../kit/text.js";

/** Where a tier digest is in its life cycle. */
export type TierDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A tier digest as the tier team keeps it. */
export class TierDigest {
  code: string;
  label: string;
  revision: number;
  name: string;
  rate: number;
  floorValue: number;
  status: TierDigestStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    name: string,
    rate: number,
    floorValue: number,
    status: TierDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.name = name;
    this.rate = rate;
    this.floorValue = floorValue;
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

  canMoveTo(next: TierDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: TierDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"tier digest"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.revision + this.rate) * 100) / 100;
  }

  copy(): TierDigest {
    return new TierDigest(this.code, this.label, this.revision, this.name, this.rate, this.floorValue, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tier digest in status proposed. */
export function newTierDigest(code: string, label: string): TierDigest {
  return new TierDigest(code, label, 0, "", 0, 0, "proposed");
}
