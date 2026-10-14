import * as text from "../../../../kit/text.js";

/** Where a lenient post snapshot is in its life cycle. */
export type LenientPostSnapshotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a lenient post snapshot and its current status. */
export class LenientPostSnapshot {
  code: string;
  name: string;
  budget: number;
  contactEmail: string;
  visible: boolean;
  margin: number;
  ownerId: string;
  notes: string;
  maximum: number;
  endsAt: number;
  sequence: number;
  status: LenientPostSnapshotStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    contactEmail: string,
    visible: boolean,
    margin: number,
    ownerId: string,
    notes: string,
    maximum: number,
    endsAt: number,
    sequence: number,
    status: LenientPostSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.contactEmail = contactEmail;
    this.visible = visible;
    this.margin = margin;
    this.ownerId = ownerId;
    this.notes = notes;
    this.maximum = maximum;
    this.endsAt = endsAt;
    this.sequence = sequence;
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

  canMoveTo(next: LenientPostSnapshotStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LenientPostSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient post snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round(this.sequence * this.budget * 100) / 100;
  }

  copy(): LenientPostSnapshot {
    return new LenientPostSnapshot(
      this.code,
      this.name,
      this.budget,
      this.contactEmail,
      this.visible,
      this.margin,
      this.ownerId,
      this.notes,
      this.maximum,
      this.endsAt,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient post snapshot in status idle. */
export function newLenientPostSnapshot(code: string, name: string): LenientPostSnapshot {
  return new LenientPostSnapshot(code, name, 0, "", false, 0, "", "", 0, 0, 0, "idle");
}
