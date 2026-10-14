import * as text from "../../../../kit/text.js";

/** Where a funnel window is in its life cycle. */
export type FunnelWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a funnel window and its current status. */
export class FunnelWindow {
  code: string;
  name: string;
  budget: number;
  revision: number;
  version: number;
  utmSource: string;
  channel: string;
  reviewer: string;
  rate: number;
  description: string;
  status: FunnelWindowStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    revision: number,
    version: number,
    utmSource: string,
    channel: string,
    reviewer: string,
    rate: number,
    description: string,
    status: FunnelWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.revision = revision;
    this.version = version;
    this.utmSource = utmSource;
    this.channel = channel;
    this.reviewer = reviewer;
    this.rate = rate;
    this.description = description;
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

  canMoveTo(next: FunnelWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
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

  moveTo(next: FunnelWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"funnel window"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.rate - this.budget) * 100) / 100;
  }

  copy(): FunnelWindow {
    return new FunnelWindow(
      this.code,
      this.name,
      this.budget,
      this.revision,
      this.version,
      this.utmSource,
      this.channel,
      this.reviewer,
      this.rate,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a funnel window in status planned. */
export function newFunnelWindow(code: string, name: string): FunnelWindow {
  return new FunnelWindow(code, name, 0, 0, 0, "", "", "", 0, "", "planned");
}
