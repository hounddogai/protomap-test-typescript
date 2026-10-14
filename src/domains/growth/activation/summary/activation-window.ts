import * as text from "../../../../kit/text.js";

/** Where a activation window is in its life cycle. */
export type ActivationWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One activation window, with what the planners need to act on it. */
export class ActivationWindow {
  code: string;
  title: string;
  approved: boolean;
  updatedAt: number;
  windowDays: number;
  externalRef: string;
  region: string;
  status: ActivationWindowStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    updatedAt: number,
    windowDays: number,
    externalRef: string,
    region: string,
    status: ActivationWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.updatedAt = updatedAt;
    this.windowDays = windowDays;
    this.externalRef = externalRef;
    this.region = region;
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

  canMoveTo(next: ActivationWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
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

  moveTo(next: ActivationWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedLoad(): number {
    return Math.round((this.windowDays + this.updatedAt) * 100) / 100;
  }

  copy(): ActivationWindow {
    return new ActivationWindow(
      this.code,
      this.title,
      this.approved,
      this.updatedAt,
      this.windowDays,
      this.externalRef,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a activation window in status planned. */
export function newActivationWindow(code: string, title: string): ActivationWindow {
  return new ActivationWindow(code, title, false, 0, 0, "", "", "planned");
}
