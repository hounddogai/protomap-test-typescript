import * as text from "../../../../kit/text.js";

/** Where a adaptive activation exception is in its life cycle. */
export type AdaptiveActivationExceptionStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A adaptive activation exception as the activation team keeps it. */
export class AdaptiveActivationException {
  code: string;
  label: string;
  phone: string;
  pinned: boolean;
  ceiling: number;
  priority: number;
  minimum: number;
  margin: number;
  status: AdaptiveActivationExceptionStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    pinned: boolean,
    ceiling: number,
    priority: number,
    minimum: number,
    margin: number,
    status: AdaptiveActivationExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.pinned = pinned;
    this.ceiling = ceiling;
    this.priority = priority;
    this.minimum = minimum;
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

  canMoveTo(next: AdaptiveActivationExceptionStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveActivationExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive activation exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netTotal(): number {
    return Math.round(this.margin * this.minimum * 100) / 100;
  }

  copy(): AdaptiveActivationException {
    return new AdaptiveActivationException(
      this.code,
      this.label,
      this.phone,
      this.pinned,
      this.ceiling,
      this.priority,
      this.minimum,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive activation exception in status planned. */
export function newAdaptiveActivationException(code: string, label: string): AdaptiveActivationException {
  return new AdaptiveActivationException(code, label, "", false, 0, 0, 0, 0, "planned");
}
