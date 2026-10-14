import * as text from "../../../../kit/text.js";

/** Where a weighted challenge snapshot is in its life cycle. */
export type WeightedChallengeSnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a weighted challenge snapshot and its current status. */
export class WeightedChallengeSnapshot {
  code: string;
  name: string;
  revision: number;
  amount: number;
  country: string;
  floorValue: number;
  channel: string;
  expiresAt: number;
  status: WeightedChallengeSnapshotStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    amount: number,
    country: string,
    floorValue: number,
    channel: string,
    expiresAt: number,
    status: WeightedChallengeSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.amount = amount;
    this.country = country;
    this.floorValue = floorValue;
    this.channel = channel;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: WeightedChallengeSnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WeightedChallengeSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted challenge snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round(this.amount * this.revision * 100) / 100;
  }

  copy(): WeightedChallengeSnapshot {
    return new WeightedChallengeSnapshot(
      this.code,
      this.name,
      this.revision,
      this.amount,
      this.country,
      this.floorValue,
      this.channel,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a weighted challenge snapshot in status planned. */
export function newWeightedChallengeSnapshot(code: string, name: string): WeightedChallengeSnapshot {
  return new WeightedChallengeSnapshot(code, name, 0, 0, "", 0, "", 0, "planned");
}
