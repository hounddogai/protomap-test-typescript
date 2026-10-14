import * as text from "../../../../kit/text.js";

/** Where a activation plan is in its life cycle. */
export type ActivationPlanStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A activation plan as the activation team keeps it. */
export class ActivationPlan {
  code: string;
  name: string;
  discount: number;
  unit: string;
  impressions: number;
  channel: string;
  margin: number;
  source: string;
  score: number;
  sendAt: number;
  capacity: number;
  status: ActivationPlanStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    unit: string,
    impressions: number,
    channel: string,
    margin: number,
    source: string,
    score: number,
    sendAt: number,
    capacity: number,
    status: ActivationPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.unit = unit;
    this.impressions = impressions;
    this.channel = channel;
    this.margin = margin;
    this.source = source;
    this.score = score;
    this.sendAt = sendAt;
    this.capacity = capacity;
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

  canMoveTo(next: ActivationPlanStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ActivationPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedValue(): number {
    return Math.round((this.discount - this.impressions) * 100) / 100;
  }

  copy(): ActivationPlan {
    return new ActivationPlan(
      this.code,
      this.name,
      this.discount,
      this.unit,
      this.impressions,
      this.channel,
      this.margin,
      this.source,
      this.score,
      this.sendAt,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a activation plan in status draft. */
export function newActivationPlan(code: string, name: string): ActivationPlan {
  return new ActivationPlan(code, name, 0, "", 0, "", 0, "", 0, 0, 0, "draft");
}
