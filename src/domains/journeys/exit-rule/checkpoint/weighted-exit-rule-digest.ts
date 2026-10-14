import * as text from "../../../../kit/text.js";

/** Where a weighted exit rule digest is in its life cycle. */
export type WeightedExitRuleDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted exit rule digest. Its code is unique within a tenant. */
export class WeightedExitRuleDigest {
  code: string;
  title: string;
  maximum: number;
  durationMinutes: number;
  phone: string;
  sendAt: number;
  name: string;
  capacity: number;
  timezone: string;
  region: string;
  status: WeightedExitRuleDigestStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    durationMinutes: number,
    phone: string,
    sendAt: number,
    name: string,
    capacity: number,
    timezone: string,
    region: string,
    status: WeightedExitRuleDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.durationMinutes = durationMinutes;
    this.phone = phone;
    this.sendAt = sendAt;
    this.name = name;
    this.capacity = capacity;
    this.timezone = timezone;
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

  canMoveTo(next: WeightedExitRuleDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
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

  moveTo(next: WeightedExitRuleDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted exit rule digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round((this.capacity - this.maximum) * 100) / 100;
  }

  copy(): WeightedExitRuleDigest {
    return new WeightedExitRuleDigest(
      this.code,
      this.title,
      this.maximum,
      this.durationMinutes,
      this.phone,
      this.sendAt,
      this.name,
      this.capacity,
      this.timezone,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a weighted exit rule digest in status planned. */
export function newWeightedExitRuleDigest(code: string, title: string): WeightedExitRuleDigest {
  return new WeightedExitRuleDigest(code, title, 0, 0, "", 0, "", 0, "", "", "planned");
}
