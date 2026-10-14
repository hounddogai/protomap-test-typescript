/**
 * The weighted domain exception records of deliverability's domain work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted domain exception is in its life cycle. */
export type WeightedDomainExceptionStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a weighted domain exception and its current status. */
export class WeightedDomainException {
  code: string;
  title: string;
  audienceId: string;
  unit: string;
  durationMinutes: number;
  updatedAt: number;
  rate: number;
  visible: boolean;
  status: WeightedDomainExceptionStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    unit: string,
    durationMinutes: number,
    updatedAt: number,
    rate: number,
    visible: boolean,
    status: WeightedDomainExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.unit = unit;
    this.durationMinutes = durationMinutes;
    this.updatedAt = updatedAt;
    this.rate = rate;
    this.visible = visible;
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

  canMoveTo(next: WeightedDomainExceptionStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedDomainExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted domain exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netVolume(): number {
    return Math.round((this.updatedAt - this.rate) * 100) / 100;
  }

  copy(): WeightedDomainException {
    return new WeightedDomainException(
      this.code,
      this.title,
      this.audienceId,
      this.unit,
      this.durationMinutes,
      this.updatedAt,
      this.rate,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a weighted domain exception in status draft. */
export function newWeightedDomainException(code: string, title: string): WeightedDomainException {
  return new WeightedDomainException(code, title, "", "", 0, 0, 0, false, "draft");
}
