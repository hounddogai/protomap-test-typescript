import * as text from "../../../../kit/text.js";

/** Where a legacy journey tier is in its life cycle. */
export type LegacyJourneyTierStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A legacy journey tier. Its code is unique within a tenant. */
export class LegacyJourneyTier {
  code: string;
  label: string;
  maximum: number;
  rate: number;
  title: string;
  approved: boolean;
  sendAt: number;
  status: LegacyJourneyTierStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    rate: number,
    title: string,
    approved: boolean,
    sendAt: number,
    status: LegacyJourneyTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.rate = rate;
    this.title = title;
    this.approved = approved;
    this.sendAt = sendAt;
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

  canMoveTo(next: LegacyJourneyTierStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        return next === "completed" || next === "cancelled";
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

  moveTo(next: LegacyJourneyTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy journey tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.sendAt - this.rate) * 100) / 100;
  }

  copy(): LegacyJourneyTier {
    return new LegacyJourneyTier(
      this.code,
      this.label,
      this.maximum,
      this.rate,
      this.title,
      this.approved,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy journey tier in status planned. */
export function newLegacyJourneyTier(code: string, label: string): LegacyJourneyTier {
  return new LegacyJourneyTier(code, label, 0, 0, "", false, 0, "planned");
}
