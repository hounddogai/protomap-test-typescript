import * as text from "../../../../kit/text.js";

/** Where a nudge baseline is in its life cycle. */
export type NudgeBaselineStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A nudge baseline as the nudge team keeps it. */
export class NudgeBaseline {
  code: string;
  title: string;
  margin: number;
  minimum: number;
  floorValue: number;
  amount: number;
  sendAt: number;
  weight: number;
  revision: number;
  region: string;
  status: NudgeBaselineStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    minimum: number,
    floorValue: number,
    amount: number,
    sendAt: number,
    weight: number,
    revision: number,
    region: string,
    status: NudgeBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.minimum = minimum;
    this.floorValue = floorValue;
    this.amount = amount;
    this.sendAt = sendAt;
    this.weight = weight;
    this.revision = revision;
    this.region = region;
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

  canMoveTo(next: NudgeBaselineStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: NudgeBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round(this.revision * this.amount * 100) / 100;
  }

  copy(): NudgeBaseline {
    return new NudgeBaseline(
      this.code,
      this.title,
      this.margin,
      this.minimum,
      this.floorValue,
      this.amount,
      this.sendAt,
      this.weight,
      this.revision,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a nudge baseline in status planned. */
export function newNudgeBaseline(code: string, title: string): NudgeBaseline {
  return new NudgeBaseline(code, title, 0, 0, 0, 0, 0, 0, 0, "", "planned");
}
