import * as text from "../../../../kit/text.js";

/** Where a weighted placement record is in its life cycle. */
export type WeightedPlacementRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted placement record as the placement team keeps it. */
export class WeightedPlacementRecord {
  code: string;
  label: string;
  notes: string;
  sendAt: number;
  title: string;
  maximum: number;
  channel: string;
  revision: number;
  description: string;
  status: WeightedPlacementRecordStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    sendAt: number,
    title: string,
    maximum: number,
    channel: string,
    revision: number,
    description: string,
    status: WeightedPlacementRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.sendAt = sendAt;
    this.title = title;
    this.maximum = maximum;
    this.channel = channel;
    this.revision = revision;
    this.description = description;
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

  canMoveTo(next: WeightedPlacementRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedPlacementRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted placement record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedValue(): number {
    return Math.round((this.maximum + this.revision) * 100) / 100;
  }

  copy(): WeightedPlacementRecord {
    return new WeightedPlacementRecord(
      this.code,
      this.label,
      this.notes,
      this.sendAt,
      this.title,
      this.maximum,
      this.channel,
      this.revision,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted placement record in status planned. */
export function newWeightedPlacementRecord(code: string, label: string): WeightedPlacementRecord {
  return new WeightedPlacementRecord(code, label, "", 0, "", 0, "", 0, "", "planned");
}
