import * as text from "../../../../kit/text.js";

/** Where a fallback reputation reservation is in its life cycle. */
export type FallbackReputationReservationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A fallback reputation reservation as the reputation team keeps it. */
export class FallbackReputationReservation {
  code: string;
  title: string;
  frequencyCap: number;
  sequence: number;
  externalRef: string;
  ownerId: string;
  cost: number;
  category: string;
  approved: boolean;
  status: FallbackReputationReservationStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    sequence: number,
    externalRef: string,
    ownerId: string,
    cost: number,
    category: string,
    approved: boolean,
    status: FallbackReputationReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.sequence = sequence;
    this.externalRef = externalRef;
    this.ownerId = ownerId;
    this.cost = cost;
    this.category = category;
    this.approved = approved;
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

  canMoveTo(next: FallbackReputationReservationStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FallbackReputationReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reputation reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback reputation reservation"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.frequencyCap * this.sequence * 100) / 100;
  }

  copy(): FallbackReputationReservation {
    return new FallbackReputationReservation(
      this.code,
      this.title,
      this.frequencyCap,
      this.sequence,
      this.externalRef,
      this.ownerId,
      this.cost,
      this.category,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback reputation reservation in status idle. */
export function newFallbackReputationReservation(code: string, title: string): FallbackReputationReservation {
  return new FallbackReputationReservation(code, title, 0, 0, "", "", 0, "", false, "idle");
}
