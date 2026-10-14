import * as text from "../../../../kit/text.js";

/** Where a seasonal preference threshold is in its life cycle. */
export type SeasonalPreferenceThresholdStatus = "new" | "queued" | "running" | "done" | "failed";

/** A seasonal preference threshold. Its code is unique within a tenant. */
export class SeasonalPreferenceThreshold {
  code: string;
  label: string;
  maximum: number;
  contactEmail: string;
  createdAt: number;
  sendAt: number;
  floorValue: number;
  sequence: number;
  status: SeasonalPreferenceThresholdStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    contactEmail: string,
    createdAt: number,
    sendAt: number,
    floorValue: number,
    sequence: number,
    status: SeasonalPreferenceThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.contactEmail = contactEmail;
    this.createdAt = createdAt;
    this.sendAt = sendAt;
    this.floorValue = floorValue;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalPreferenceThresholdStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalPreferenceThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal preference threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netVolume(): number {
    return Math.round((this.floorValue + this.createdAt) * 100) / 100;
  }

  copy(): SeasonalPreferenceThreshold {
    return new SeasonalPreferenceThreshold(
      this.code,
      this.label,
      this.maximum,
      this.contactEmail,
      this.createdAt,
      this.sendAt,
      this.floorValue,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal preference threshold in status new. */
export function newSeasonalPreferenceThreshold(code: string, label: string): SeasonalPreferenceThreshold {
  return new SeasonalPreferenceThreshold(code, label, 0, "", 0, 0, 0, 0, "new");
}
