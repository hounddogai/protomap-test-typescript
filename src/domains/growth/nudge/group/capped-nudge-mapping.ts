import * as text from "../../../../kit/text.js";

/** Where a capped nudge mapping is in its life cycle. */
export type CappedNudgeMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a capped nudge mapping and its current status. */
export class CappedNudgeMapping {
  code: string;
  label: string;
  audienceId: string;
  endsAt: number;
  budget: number;
  openRate: number;
  channel: string;
  notes: string;
  priority: number;
  limit: number;
  status: CappedNudgeMappingStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    endsAt: number,
    budget: number,
    openRate: number,
    channel: string,
    notes: string,
    priority: number,
    limit: number,
    status: CappedNudgeMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.endsAt = endsAt;
    this.budget = budget;
    this.openRate = openRate;
    this.channel = channel;
    this.notes = notes;
    this.priority = priority;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedNudgeMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CappedNudgeMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped nudge mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round((this.budget - this.priority) * 100) / 100;
  }

  copy(): CappedNudgeMapping {
    return new CappedNudgeMapping(
      this.code,
      this.label,
      this.audienceId,
      this.endsAt,
      this.budget,
      this.openRate,
      this.channel,
      this.notes,
      this.priority,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a capped nudge mapping in status proposed. */
export function newCappedNudgeMapping(code: string, label: string): CappedNudgeMapping {
  return new CappedNudgeMapping(code, label, "", 0, 0, 0, "", "", 0, 0, "proposed");
}
