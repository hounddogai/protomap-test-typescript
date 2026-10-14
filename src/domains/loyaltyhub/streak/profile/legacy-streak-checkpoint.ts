import * as text from "../../../../kit/text.js";

/** Where a legacy streak checkpoint is in its life cycle. */
export type LegacyStreakCheckpointStatus = "requested" | "granted" | "revoked" | "expired";

/** A legacy streak checkpoint. Its code is unique within a tenant. */
export class LegacyStreakCheckpoint {
  code: string;
  title: string;
  weight: number;
  phone: string;
  floorValue: number;
  status: LegacyStreakCheckpointStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    phone: string,
    floorValue: number,
    status: LegacyStreakCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.phone = phone;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyStreakCheckpointStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyStreakCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy streak checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedValue(): number {
    return Math.round((this.floorValue - this.weight) * 100) / 100;
  }

  copy(): LegacyStreakCheckpoint {
    return new LegacyStreakCheckpoint(this.code, this.title, this.weight, this.phone, this.floorValue, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy streak checkpoint in status requested. */
export function newLegacyStreakCheckpoint(code: string, title: string): LegacyStreakCheckpoint {
  return new LegacyStreakCheckpoint(code, title, 0, "", 0, "requested");
}
