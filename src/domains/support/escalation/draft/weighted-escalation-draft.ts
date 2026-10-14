import * as text from "../../../../kit/text.js";

/** Where a weighted escalation draft is in its life cycle. */
export type WeightedEscalationDraftStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A weighted escalation draft as the escalation team keeps it. */
export class WeightedEscalationDraft {
  code: string;
  title: string;
  journeyId: string;
  priority: number;
  channel: string;
  retries: number;
  conversionRate: number;
  durationMinutes: number;
  status: WeightedEscalationDraftStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    priority: number,
    channel: string,
    retries: number,
    conversionRate: number,
    durationMinutes: number,
    status: WeightedEscalationDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.priority = priority;
    this.channel = channel;
    this.retries = retries;
    this.conversionRate = conversionRate;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: WeightedEscalationDraftStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedEscalationDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted escalation draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted escalation draft"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.durationMinutes * this.priority * 100) / 100;
  }

  copy(): WeightedEscalationDraft {
    return new WeightedEscalationDraft(
      this.code,
      this.title,
      this.journeyId,
      this.priority,
      this.channel,
      this.retries,
      this.conversionRate,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted escalation draft in status draft. */
export function newWeightedEscalationDraft(code: string, title: string): WeightedEscalationDraft {
  return new WeightedEscalationDraft(code, title, "", 0, "", 0, 0, 0, "draft");
}
