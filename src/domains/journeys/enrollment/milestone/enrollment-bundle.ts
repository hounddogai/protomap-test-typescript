import * as text from "../../../../kit/text.js";

/** Where a enrollment bundle is in its life cycle. */
export type EnrollmentBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a enrollment bundle and its current status. */
export class EnrollmentBundle {
  code: string;
  title: string;
  source: string;
  quantity: number;
  startsAt: number;
  retries: number;
  budget: number;
  category: string;
  status: EnrollmentBundleStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    quantity: number,
    startsAt: number,
    retries: number,
    budget: number,
    category: string,
    status: EnrollmentBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.quantity = quantity;
    this.startsAt = startsAt;
    this.retries = retries;
    this.budget = budget;
    this.category = category;
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

  canMoveTo(next: EnrollmentBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: EnrollmentBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedTotal(): number {
    return Math.round((this.quantity + this.retries) * 100) / 100;
  }

  copy(): EnrollmentBundle {
    return new EnrollmentBundle(
      this.code,
      this.title,
      this.source,
      this.quantity,
      this.startsAt,
      this.retries,
      this.budget,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a enrollment bundle in status idle. */
export function newEnrollmentBundle(code: string, title: string): EnrollmentBundle {
  return new EnrollmentBundle(code, title, "", 0, 0, 0, 0, "", "idle");
}
