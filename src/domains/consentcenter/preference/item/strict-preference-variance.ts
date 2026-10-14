import * as text from "../../../../kit/text.js";

/** Where a strict preference variance is in its life cycle. */
export type StrictPreferenceVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict preference variance. Its code is unique within a tenant. */
export class StrictPreferenceVariance {
  code: string;
  title: string;
  updatedAt: number;
  visible: boolean;
  discount: number;
  description: string;
  ownerId: string;
  reviewer: string;
  rate: number;
  capacity: number;
  status: StrictPreferenceVarianceStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    visible: boolean,
    discount: number,
    description: string,
    ownerId: string,
    reviewer: string,
    rate: number,
    capacity: number,
    status: StrictPreferenceVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.visible = visible;
    this.discount = discount;
    this.description = description;
    this.ownerId = ownerId;
    this.reviewer = reviewer;
    this.rate = rate;
    this.capacity = capacity;
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

  canMoveTo(next: StrictPreferenceVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictPreferenceVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict preference variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.capacity + this.updatedAt) * 100) / 100;
  }

  copy(): StrictPreferenceVariance {
    return new StrictPreferenceVariance(
      this.code,
      this.title,
      this.updatedAt,
      this.visible,
      this.discount,
      this.description,
      this.ownerId,
      this.reviewer,
      this.rate,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict preference variance in status idle. */
export function newStrictPreferenceVariance(code: string, title: string): StrictPreferenceVariance {
  return new StrictPreferenceVariance(code, title, 0, false, 0, "", "", "", 0, 0, "idle");
}
