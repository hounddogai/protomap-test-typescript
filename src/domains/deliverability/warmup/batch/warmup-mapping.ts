import * as text from "../../../../kit/text.js";

/** Where a warmup mapping is in its life cycle. */
export type WarmupMappingStatus = "created" | "validated" | "published" | "retired";

/** The record of a warmup mapping and its current status. */
export class WarmupMapping {
  code: string;
  label: string;
  visible: boolean;
  budget: number;
  impressions: number;
  pinned: boolean;
  utmSource: string;
  sendAt: number;
  status: WarmupMappingStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    budget: number,
    impressions: number,
    pinned: boolean,
    utmSource: string,
    sendAt: number,
    status: WarmupMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.budget = budget;
    this.impressions = impressions;
    this.pinned = pinned;
    this.utmSource = utmSource;
    this.sendAt = sendAt;
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

  canMoveTo(next: WarmupMappingStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WarmupMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netVolume(): number {
    return Math.round(this.budget * this.sendAt * 100) / 100;
  }

  copy(): WarmupMapping {
    return new WarmupMapping(
      this.code,
      this.label,
      this.visible,
      this.budget,
      this.impressions,
      this.pinned,
      this.utmSource,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a warmup mapping in status created. */
export function newWarmupMapping(code: string, label: string): WarmupMapping {
  return new WarmupMapping(code, label, false, 0, 0, false, "", 0, "created");
}
