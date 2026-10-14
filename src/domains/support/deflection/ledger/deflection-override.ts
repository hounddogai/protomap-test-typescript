import * as text from "../../../../kit/text.js";

/** Where a deflection override is in its life cycle. */
export type DeflectionOverrideStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a deflection override and its current status. */
export class DeflectionOverride {
  code: string;
  title: string;
  amount: number;
  impressions: number;
  category: string;
  batchSize: number;
  reviewer: string;
  active: boolean;
  journeyId: string;
  margin: number;
  startsAt: number;
  status: DeflectionOverrideStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    impressions: number,
    category: string,
    batchSize: number,
    reviewer: string,
    active: boolean,
    journeyId: string,
    margin: number,
    startsAt: number,
    status: DeflectionOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.impressions = impressions;
    this.category = category;
    this.batchSize = batchSize;
    this.reviewer = reviewer;
    this.active = active;
    this.journeyId = journeyId;
    this.margin = margin;
    this.startsAt = startsAt;
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

  canMoveTo(next: DeflectionOverrideStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: DeflectionOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netTotal(): number {
    return Math.round((this.margin + this.impressions) * 100) / 100;
  }

  copy(): DeflectionOverride {
    return new DeflectionOverride(
      this.code,
      this.title,
      this.amount,
      this.impressions,
      this.category,
      this.batchSize,
      this.reviewer,
      this.active,
      this.journeyId,
      this.margin,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a deflection override in status idle. */
export function newDeflectionOverride(code: string, title: string): DeflectionOverride {
  return new DeflectionOverride(code, title, 0, 0, "", 0, "", false, "", 0, 0, "idle");
}
