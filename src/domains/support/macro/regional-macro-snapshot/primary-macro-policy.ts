import * as text from "../../../../kit/text.js";

/** Where a primary macro policy is in its life cycle. */
export type PrimaryMacroPolicyStatus = "created" | "validated" | "published" | "retired";

/** A primary macro policy as the macro team keeps it. */
export class PrimaryMacroPolicy {
  code: string;
  title: string;
  utmSource: string;
  pinned: boolean;
  weight: number;
  capacity: number;
  durationMinutes: number;
  floorValue: number;
  expiresAt: number;
  ceiling: number;
  revision: number;
  status: PrimaryMacroPolicyStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    pinned: boolean,
    weight: number,
    capacity: number,
    durationMinutes: number,
    floorValue: number,
    expiresAt: number,
    ceiling: number,
    revision: number,
    status: PrimaryMacroPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.pinned = pinned;
    this.weight = weight;
    this.capacity = capacity;
    this.durationMinutes = durationMinutes;
    this.floorValue = floorValue;
    this.expiresAt = expiresAt;
    this.ceiling = ceiling;
    this.revision = revision;
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

  canMoveTo(next: PrimaryMacroPolicyStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PrimaryMacroPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary macro policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netTotal(): number {
    return Math.round((this.weight + this.expiresAt) * 100) / 100;
  }

  copy(): PrimaryMacroPolicy {
    return new PrimaryMacroPolicy(
      this.code,
      this.title,
      this.utmSource,
      this.pinned,
      this.weight,
      this.capacity,
      this.durationMinutes,
      this.floorValue,
      this.expiresAt,
      this.ceiling,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a primary macro policy in status created. */
export function newPrimaryMacroPolicy(code: string, title: string): PrimaryMacroPolicy {
  return new PrimaryMacroPolicy(code, title, "", false, 0, 0, 0, 0, 0, 0, 0, "created");
}
