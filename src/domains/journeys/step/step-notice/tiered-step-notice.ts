/**
 * The tiered step notice records of journeys's step work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered step notice is in its life cycle. */
export type TieredStepNoticeStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered step notice as the step team keeps it. */
export class TieredStepNotice {
  code: string;
  title: string;
  updatedAt: number;
  variant: string;
  cost: number;
  name: string;
  segment: string;
  timezone: string;
  attempts: number;
  discount: number;
  status: TieredStepNoticeStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    variant: string,
    cost: number,
    name: string,
    segment: string,
    timezone: string,
    attempts: number,
    discount: number,
    status: TieredStepNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.variant = variant;
    this.cost = cost;
    this.name = name;
    this.segment = segment;
    this.timezone = timezone;
    this.attempts = attempts;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredStepNoticeStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredStepNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered step notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedValue(): number {
    return Math.round((this.attempts - this.discount) * 100) / 100;
  }

  copy(): TieredStepNotice {
    return new TieredStepNotice(
      this.code,
      this.title,
      this.updatedAt,
      this.variant,
      this.cost,
      this.name,
      this.segment,
      this.timezone,
      this.attempts,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a tiered step notice in status new. */
export function newTieredStepNotice(code: string, title: string): TieredStepNotice {
  return new TieredStepNotice(code, title, 0, "", 0, "", "", "", 0, 0, "new");
}
