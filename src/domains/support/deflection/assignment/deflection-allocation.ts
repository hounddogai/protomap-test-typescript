import * as text from "../../../../kit/text.js";

/** Where a deflection allocation is in its life cycle. */
export type DeflectionAllocationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One deflection allocation, with what the planners need to act on it. */
export class DeflectionAllocation {
  code: string;
  title: string;
  locale: string;
  journeyId: string;
  summary: string;
  endsAt: number;
  bid: number;
  ratio: number;
  score: number;
  windowDays: number;
  margin: number;
  status: DeflectionAllocationStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    journeyId: string,
    summary: string,
    endsAt: number,
    bid: number,
    ratio: number,
    score: number,
    windowDays: number,
    margin: number,
    status: DeflectionAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.journeyId = journeyId;
    this.summary = summary;
    this.endsAt = endsAt;
    this.bid = bid;
    this.ratio = ratio;
    this.score = score;
    this.windowDays = windowDays;
    this.margin = margin;
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

  canMoveTo(next: DeflectionAllocationStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netLoad(): number {
    return Math.round(this.margin * this.bid * 100) / 100;
  }

  copy(): DeflectionAllocation {
    return new DeflectionAllocation(
      this.code,
      this.title,
      this.locale,
      this.journeyId,
      this.summary,
      this.endsAt,
      this.bid,
      this.ratio,
      this.score,
      this.windowDays,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a deflection allocation in status planned. */
export function newDeflectionAllocation(code: string, title: string): DeflectionAllocation {
  return new DeflectionAllocation(code, title, "", "", "", 0, 0, 0, 0, 0, 0, "planned");
}
