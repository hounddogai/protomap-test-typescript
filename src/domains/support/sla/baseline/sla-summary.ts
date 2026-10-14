import * as text from "../../../../kit/text.js";

/** Where a sla summary is in its life cycle. */
export type SlaSummaryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A sla summary as the sla team keeps it. */
export class SlaSummary {
  code: string;
  label: string;
  notes: string;
  pinned: boolean;
  endsAt: number;
  score: number;
  utmSource: string;
  category: string;
  timezone: string;
  status: SlaSummaryStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    pinned: boolean,
    endsAt: number,
    score: number,
    utmSource: string,
    category: string,
    timezone: string,
    status: SlaSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.pinned = pinned;
    this.endsAt = endsAt;
    this.score = score;
    this.utmSource = utmSource;
    this.category = category;
    this.timezone = timezone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: SlaSummaryStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"sla summary"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.score * this.endsAt * 100) / 100;
  }

  copy(): SlaSummary {
    return new SlaSummary(
      this.code,
      this.label,
      this.notes,
      this.pinned,
      this.endsAt,
      this.score,
      this.utmSource,
      this.category,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a sla summary in status idle. */
export function newSlaSummary(code: string, label: string): SlaSummary {
  return new SlaSummary(code, label, "", false, 0, 0, "", "", "", "idle");
}
