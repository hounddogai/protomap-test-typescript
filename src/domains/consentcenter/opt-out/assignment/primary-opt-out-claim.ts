import * as text from "../../../../kit/text.js";

/** Where a primary opt out claim is in its life cycle. */
export type PrimaryOptOutClaimStatus = "created" | "validated" | "published" | "retired";

/** A primary opt out claim. Its code is unique within a tenant. */
export class PrimaryOptOutClaim {
  code: string;
  label: string;
  revision: number;
  weight: number;
  maximum: number;
  durationMinutes: number;
  score: number;
  minimum: number;
  retries: number;
  batchSize: number;
  status: PrimaryOptOutClaimStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    weight: number,
    maximum: number,
    durationMinutes: number,
    score: number,
    minimum: number,
    retries: number,
    batchSize: number,
    status: PrimaryOptOutClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.weight = weight;
    this.maximum = maximum;
    this.durationMinutes = durationMinutes;
    this.score = score;
    this.minimum = minimum;
    this.retries = retries;
    this.batchSize = batchSize;
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

  canMoveTo(next: PrimaryOptOutClaimStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryOptOutClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary opt out claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedExposure(): number {
    return Math.round(this.retries * this.batchSize * 100) / 100;
  }

  copy(): PrimaryOptOutClaim {
    return new PrimaryOptOutClaim(
      this.code,
      this.label,
      this.revision,
      this.weight,
      this.maximum,
      this.durationMinutes,
      this.score,
      this.minimum,
      this.retries,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary opt out claim in status created. */
export function newPrimaryOptOutClaim(code: string, label: string): PrimaryOptOutClaim {
  return new PrimaryOptOutClaim(code, label, 0, 0, 0, 0, 0, 0, 0, 0, "created");
}
