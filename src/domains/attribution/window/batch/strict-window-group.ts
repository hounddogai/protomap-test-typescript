import * as text from "../../../../kit/text.js";

/** Where a strict window group is in its life cycle. */
export type StrictWindowGroupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A strict window group as the window team keeps it. */
export class StrictWindowGroup {
  code: string;
  label: string;
  active: boolean;
  channel: string;
  retries: number;
  clicks: number;
  weight: number;
  frequencyCap: number;
  openRate: number;
  checksum: string;
  status: StrictWindowGroupStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    channel: string,
    retries: number,
    clicks: number,
    weight: number,
    frequencyCap: number,
    openRate: number,
    checksum: string,
    status: StrictWindowGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.channel = channel;
    this.retries = retries;
    this.clicks = clicks;
    this.weight = weight;
    this.frequencyCap = frequencyCap;
    this.openRate = openRate;
    this.checksum = checksum;
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

  canMoveTo(next: StrictWindowGroupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StrictWindowGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict window group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"strict window group"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.frequencyCap * this.clicks * 100) / 100;
  }

  copy(): StrictWindowGroup {
    return new StrictWindowGroup(
      this.code,
      this.label,
      this.active,
      this.channel,
      this.retries,
      this.clicks,
      this.weight,
      this.frequencyCap,
      this.openRate,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict window group in status planned. */
export function newStrictWindowGroup(code: string, label: string): StrictWindowGroup {
  return new StrictWindowGroup(code, label, false, "", 0, 0, 0, 0, 0, "", "planned");
}
