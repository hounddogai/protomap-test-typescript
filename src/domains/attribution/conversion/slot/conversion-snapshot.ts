import * as text from "../../../../kit/text.js";

/** Where a conversion snapshot is in its life cycle. */
export type ConversionSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A conversion snapshot as the conversion team keeps it. */
export class ConversionSnapshot {
  code: string;
  name: string;
  notes: string;
  channel: string;
  floorValue: number;
  tags: string[];
  weight: number;
  sequence: number;
  status: ConversionSnapshotStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    channel: string,
    floorValue: number,
    tags: string[],
    weight: number,
    sequence: number,
    status: ConversionSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.channel = channel;
    this.floorValue = floorValue;
    this.tags = tags;
    this.weight = weight;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ConversionSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ConversionSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedExposure(): number {
    return Math.round((this.sequence + this.weight) * 100) / 100;
  }

  copy(): ConversionSnapshot {
    return new ConversionSnapshot(
      this.code,
      this.name,
      this.notes,
      this.channel,
      this.floorValue,
      this.tags,
      this.weight,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a conversion snapshot in status draft. */
export function newConversionSnapshot(code: string, name: string): ConversionSnapshot {
  return new ConversionSnapshot(code, name, "", "", 0, [], 0, 0, "draft");
}
