import * as text from "../../../../kit/text.js";

/** Where a activation segment is in its life cycle. */
export type ActivationSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One activation segment, with what the planners need to act on it. */
export class ActivationSegment {
  code: string;
  label: string;
  endsAt: number;
  sendAt: number;
  approved: boolean;
  amount: number;
  impressions: number;
  active: boolean;
  revision: number;
  status: ActivationSegmentStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    sendAt: number,
    approved: boolean,
    amount: number,
    impressions: number,
    active: boolean,
    revision: number,
    status: ActivationSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.sendAt = sendAt;
    this.approved = approved;
    this.amount = amount;
    this.impressions = impressions;
    this.active = active;
    this.revision = revision;
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

  canMoveTo(next: ActivationSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ActivationSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round(this.endsAt * this.amount * 100) / 100;
  }

  copy(): ActivationSegment {
    return new ActivationSegment(
      this.code,
      this.label,
      this.endsAt,
      this.sendAt,
      this.approved,
      this.amount,
      this.impressions,
      this.active,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a activation segment in status planned. */
export function newActivationSegment(code: string, label: string): ActivationSegment {
  return new ActivationSegment(code, label, 0, 0, false, 0, 0, false, 0, "planned");
}
