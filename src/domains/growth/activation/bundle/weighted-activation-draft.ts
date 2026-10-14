import * as text from "../../../../kit/text.js";

/** Where a weighted activation draft is in its life cycle. */
export type WeightedActivationDraftStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One weighted activation draft, with what the planners need to act on it. */
export class WeightedActivationDraft {
  code: string;
  label: string;
  timezone: string;
  sendAt: number;
  clicks: number;
  visible: boolean;
  status: WeightedActivationDraftStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    sendAt: number,
    clicks: number,
    visible: boolean,
    status: WeightedActivationDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.sendAt = sendAt;
    this.clicks = clicks;
    this.visible = visible;
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

  canMoveTo(next: WeightedActivationDraftStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WeightedActivationDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted activation draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netLoad(): number {
    return Math.round((this.sendAt + this.clicks) * 100) / 100;
  }

  copy(): WeightedActivationDraft {
    return new WeightedActivationDraft(
      this.code,
      this.label,
      this.timezone,
      this.sendAt,
      this.clicks,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted activation draft in status planned. */
export function newWeightedActivationDraft(code: string, label: string): WeightedActivationDraft {
  return new WeightedActivationDraft(code, label, "", 0, 0, false, "planned");
}
