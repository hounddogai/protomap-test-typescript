import * as text from "../../../../kit/text.js";

/** Where a double opt in claim is in its life cycle. */
export type DoubleOptInClaimStatus = "created" | "validated" | "published" | "retired";

/** One double opt in claim, with what the planners need to act on it. */
export class DoubleOptInClaim {
  code: string;
  name: string;
  frequencyCap: number;
  checksum: string;
  archived: boolean;
  segment: string;
  margin: number;
  sendAt: number;
  status: DoubleOptInClaimStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    checksum: string,
    archived: boolean,
    segment: string,
    margin: number,
    sendAt: number,
    status: DoubleOptInClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.checksum = checksum;
    this.archived = archived;
    this.segment = segment;
    this.margin = margin;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DoubleOptInClaimStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DoubleOptInClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedVolume(): number {
    return Math.round((this.frequencyCap + this.margin) * 100) / 100;
  }

  copy(): DoubleOptInClaim {
    return new DoubleOptInClaim(
      this.code,
      this.name,
      this.frequencyCap,
      this.checksum,
      this.archived,
      this.segment,
      this.margin,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a double opt in claim in status created. */
export function newDoubleOptInClaim(code: string, name: string): DoubleOptInClaim {
  return new DoubleOptInClaim(code, name, 0, "", false, "", 0, 0, "created");
}
