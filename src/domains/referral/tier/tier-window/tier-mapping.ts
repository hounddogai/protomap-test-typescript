import * as text from "../../../../kit/text.js";

/** Where a tier mapping is in its life cycle. */
export type TierMappingStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a tier mapping and its current status. */
export class TierMapping {
  code: string;
  title: string;
  budget: number;
  contactEmail: string;
  batchSize: number;
  bid: number;
  status: TierMappingStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    contactEmail: string,
    batchSize: number,
    bid: number,
    status: TierMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.contactEmail = contactEmail;
    this.batchSize = batchSize;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: TierMappingStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TierMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tier mapping"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.bid * this.budget * 100) / 100;
  }

  copy(): TierMapping {
    return new TierMapping(
      this.code,
      this.title,
      this.budget,
      this.contactEmail,
      this.batchSize,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tier mapping in status idle. */
export function newTierMapping(code: string, title: string): TierMapping {
  return new TierMapping(code, title, 0, "", 0, 0, "idle");
}
