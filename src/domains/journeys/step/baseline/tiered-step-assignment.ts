import * as text from "../../../../kit/text.js";

/** Where a tiered step assignment is in its life cycle. */
export type TieredStepAssignmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered step assignment as the step team keeps it. */
export class TieredStepAssignment {
  code: string;
  name: string;
  channel: string;
  impressions: number;
  journeyId: string;
  retries: number;
  durationMinutes: number;
  contactEmail: string;
  segment: string;
  visible: boolean;
  utmSource: string;
  status: TieredStepAssignmentStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    impressions: number,
    journeyId: string,
    retries: number,
    durationMinutes: number,
    contactEmail: string,
    segment: string,
    visible: boolean,
    utmSource: string,
    status: TieredStepAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.impressions = impressions;
    this.journeyId = journeyId;
    this.retries = retries;
    this.durationMinutes = durationMinutes;
    this.contactEmail = contactEmail;
    this.segment = segment;
    this.visible = visible;
    this.utmSource = utmSource;
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

  canMoveTo(next: TieredStepAssignmentStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredStepAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered step assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedTotal(): number {
    return Math.round((this.impressions - this.durationMinutes) * 100) / 100;
  }

  copy(): TieredStepAssignment {
    return new TieredStepAssignment(
      this.code,
      this.name,
      this.channel,
      this.impressions,
      this.journeyId,
      this.retries,
      this.durationMinutes,
      this.contactEmail,
      this.segment,
      this.visible,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered step assignment in status planned. */
export function newTieredStepAssignment(code: string, name: string): TieredStepAssignment {
  return new TieredStepAssignment(code, name, "", 0, "", 0, 0, "", "", false, "", "planned");
}
