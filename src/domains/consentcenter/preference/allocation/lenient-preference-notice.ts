import * as text from "../../../../kit/text.js";

/** Where a lenient preference notice is in its life cycle. */
export type LenientPreferenceNoticeStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient preference notice as the preference team keeps it. */
export class LenientPreferenceNotice {
  code: string;
  name: string;
  quantity: number;
  variant: string;
  priority: number;
  channel: string;
  audienceId: string;
  ownerId: string;
  maximum: number;
  unit: string;
  country: string;
  status: LenientPreferenceNoticeStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    variant: string,
    priority: number,
    channel: string,
    audienceId: string,
    ownerId: string,
    maximum: number,
    unit: string,
    country: string,
    status: LenientPreferenceNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.variant = variant;
    this.priority = priority;
    this.channel = channel;
    this.audienceId = audienceId;
    this.ownerId = ownerId;
    this.maximum = maximum;
    this.unit = unit;
    this.country = country;
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

  canMoveTo(next: LenientPreferenceNoticeStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LenientPreferenceNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient preference notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netExposure(): number {
    return Math.round(this.priority * this.maximum * 100) / 100;
  }

  copy(): LenientPreferenceNotice {
    return new LenientPreferenceNotice(
      this.code,
      this.name,
      this.quantity,
      this.variant,
      this.priority,
      this.channel,
      this.audienceId,
      this.ownerId,
      this.maximum,
      this.unit,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient preference notice in status planned. */
export function newLenientPreferenceNotice(code: string, name: string): LenientPreferenceNotice {
  return new LenientPreferenceNotice(code, name, 0, "", 0, "", "", "", 0, "", "", "planned");
}
