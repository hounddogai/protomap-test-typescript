import * as text from "../../../../kit/text.js";

/** Where a placement claim is in its life cycle. */
export type PlacementClaimStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A placement claim. Its code is unique within a tenant. */
export class PlacementClaim {
  code: string;
  title: string;
  sequence: number;
  summary: string;
  checksum: string;
  expiresAt: number;
  status: PlacementClaimStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    summary: string,
    checksum: string,
    expiresAt: number,
    status: PlacementClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.summary = summary;
    this.checksum = checksum;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: PlacementClaimStatus): boolean {
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

  moveTo(next: PlacementClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedValue(): number {
    return Math.round((this.expiresAt - this.sequence) * 100) / 100;
  }

  copy(): PlacementClaim {
    return new PlacementClaim(
      this.code,
      this.title,
      this.sequence,
      this.summary,
      this.checksum,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a placement claim in status proposed. */
export function newPlacementClaim(code: string, title: string): PlacementClaim {
  return new PlacementClaim(code, title, 0, "", "", 0, "proposed");
}
