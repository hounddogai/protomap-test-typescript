import * as text from "../../../../kit/text.js";

/** Where a enrollment preference is in its life cycle. */
export type EnrollmentPreferenceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a enrollment preference and its current status. */
export class EnrollmentPreference {
  code: string;
  title: string;
  score: number;
  quantity: number;
  updatedAt: number;
  minimum: number;
  status: EnrollmentPreferenceStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    quantity: number,
    updatedAt: number,
    minimum: number,
    status: EnrollmentPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.quantity = quantity;
    this.updatedAt = updatedAt;
    this.minimum = minimum;
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

  canMoveTo(next: EnrollmentPreferenceStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EnrollmentPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveValue(): number {
    return Math.round((this.score + this.quantity) * 100) / 100;
  }

  copy(): EnrollmentPreference {
    return new EnrollmentPreference(
      this.code,
      this.title,
      this.score,
      this.quantity,
      this.updatedAt,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a enrollment preference in status idle. */
export function newEnrollmentPreference(code: string, title: string): EnrollmentPreference {
  return new EnrollmentPreference(code, title, 0, 0, 0, 0, "idle");
}
