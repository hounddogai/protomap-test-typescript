import * as text from "../../../../kit/text.js";

/** Where a primary placement tier is in its life cycle. */
export type PrimaryPlacementTierStatus = "created" | "validated" | "published" | "retired";

/** A primary placement tier as the placement team keeps it. */
export class PrimaryPlacementTier {
  code: string;
  title: string;
  batchSize: number;
  variant: string;
  retries: number;
  durationMinutes: number;
  status: PrimaryPlacementTierStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    variant: string,
    retries: number,
    durationMinutes: number,
    status: PrimaryPlacementTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.variant = variant;
    this.retries = retries;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: PrimaryPlacementTierStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryPlacementTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary placement tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedVolume(): number {
    return Math.round((this.durationMinutes - this.retries) * 100) / 100;
  }

  copy(): PrimaryPlacementTier {
    return new PrimaryPlacementTier(
      this.code,
      this.title,
      this.batchSize,
      this.variant,
      this.retries,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary placement tier in status created. */
export function newPrimaryPlacementTier(code: string, title: string): PrimaryPlacementTier {
  return new PrimaryPlacementTier(code, title, 0, "", 0, 0, "created");
}
