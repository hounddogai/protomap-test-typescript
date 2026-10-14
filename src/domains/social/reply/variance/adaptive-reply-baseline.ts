import * as text from "../../../../kit/text.js";

/** Where a adaptive reply baseline is in its life cycle. */
export type AdaptiveReplyBaselineStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A adaptive reply baseline as the reply team keeps it. */
export class AdaptiveReplyBaseline {
  code: string;
  title: string;
  segment: string;
  graceDays: number;
  source: string;
  name: string;
  startsAt: number;
  quantity: number;
  status: AdaptiveReplyBaselineStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    graceDays: number,
    source: string,
    name: string,
    startsAt: number,
    quantity: number,
    status: AdaptiveReplyBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.graceDays = graceDays;
    this.source = source;
    this.name = name;
    this.startsAt = startsAt;
    this.quantity = quantity;
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

  canMoveTo(next: AdaptiveReplyBaselineStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: AdaptiveReplyBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive reply baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"adaptive reply baseline"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.quantity * this.startsAt * 100) / 100;
  }

  copy(): AdaptiveReplyBaseline {
    return new AdaptiveReplyBaseline(
      this.code,
      this.title,
      this.segment,
      this.graceDays,
      this.source,
      this.name,
      this.startsAt,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a adaptive reply baseline in status planned. */
export function newAdaptiveReplyBaseline(code: string, title: string): AdaptiveReplyBaseline {
  return new AdaptiveReplyBaseline(code, title, "", 0, "", "", 0, 0, "planned");
}
