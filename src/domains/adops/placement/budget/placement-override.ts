import * as text from "../../../../kit/text.js";

/** Where a placement override is in its life cycle. */
export type PlacementOverrideStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A placement override as the placement team keeps it. */
export class PlacementOverride {
  code: string;
  title: string;
  channel: string;
  approved: boolean;
  variant: string;
  utmSource: string;
  description: string;
  visible: boolean;
  sendAt: number;
  floorValue: number;
  audienceId: string;
  status: PlacementOverrideStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    approved: boolean,
    variant: string,
    utmSource: string,
    description: string,
    visible: boolean,
    sendAt: number,
    floorValue: number,
    audienceId: string,
    status: PlacementOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.approved = approved;
    this.variant = variant;
    this.utmSource = utmSource;
    this.description = description;
    this.visible = visible;
    this.sendAt = sendAt;
    this.floorValue = floorValue;
    this.audienceId = audienceId;
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

  canMoveTo(next: PlacementOverrideStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PlacementOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"placement override"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.floorValue * this.sendAt * 100) / 100;
  }

  copy(): PlacementOverride {
    return new PlacementOverride(
      this.code,
      this.title,
      this.channel,
      this.approved,
      this.variant,
      this.utmSource,
      this.description,
      this.visible,
      this.sendAt,
      this.floorValue,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a placement override in status planned. */
export function newPlacementOverride(code: string, title: string): PlacementOverride {
  return new PlacementOverride(code, title, "", false, "", "", "", false, 0, 0, "", "planned");
}
