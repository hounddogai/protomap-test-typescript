import * as text from "../../../../kit/text.js";

/** Where a legacy journey mapping is in its life cycle. */
export type LegacyJourneyMappingStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A legacy journey mapping as the journey team keeps it. */
export class LegacyJourneyMapping {
  code: string;
  label: string;
  weight: number;
  endsAt: number;
  conversionRate: number;
  ratio: number;
  status: LegacyJourneyMappingStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    endsAt: number,
    conversionRate: number,
    ratio: number,
    status: LegacyJourneyMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.endsAt = endsAt;
    this.conversionRate = conversionRate;
    this.ratio = ratio;
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

  canMoveTo(next: LegacyJourneyMappingStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LegacyJourneyMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy journey mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netExposure(): number {
    return Math.round(this.endsAt * this.conversionRate * 100) / 100;
  }

  copy(): LegacyJourneyMapping {
    return new LegacyJourneyMapping(
      this.code,
      this.label,
      this.weight,
      this.endsAt,
      this.conversionRate,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy journey mapping in status planned. */
export function newLegacyJourneyMapping(code: string, label: string): LegacyJourneyMapping {
  return new LegacyJourneyMapping(code, label, 0, 0, 0, 0, "planned");
}
