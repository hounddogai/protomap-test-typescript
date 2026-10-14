/**
 * The warmup schedule records of deliverability's warmup work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a warmup schedule is in its life cycle. */
export type WarmupScheduleStatus = "created" | "validated" | "published" | "retired";

/** A warmup schedule as the warmup team keeps it. */
export class WarmupSchedule {
  code: string;
  title: string;
  margin: number;
  endsAt: number;
  createdAt: number;
  attempts: number;
  description: string;
  active: boolean;
  maximum: number;
  minimum: number;
  sequence: number;
  status: WarmupScheduleStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    endsAt: number,
    createdAt: number,
    attempts: number,
    description: string,
    active: boolean,
    maximum: number,
    minimum: number,
    sequence: number,
    status: WarmupScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.endsAt = endsAt;
    this.createdAt = createdAt;
    this.attempts = attempts;
    this.description = description;
    this.active = active;
    this.maximum = maximum;
    this.minimum = minimum;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WarmupScheduleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WarmupScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"warmup schedule"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.margin - this.maximum) * 100) / 100;
  }

  copy(): WarmupSchedule {
    return new WarmupSchedule(
      this.code,
      this.title,
      this.margin,
      this.endsAt,
      this.createdAt,
      this.attempts,
      this.description,
      this.active,
      this.maximum,
      this.minimum,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a warmup schedule in status created. */
export function newWarmupSchedule(code: string, title: string): WarmupSchedule {
  return new WarmupSchedule(code, title, 0, 0, 0, 0, "", false, 0, 0, 0, "created");
}
