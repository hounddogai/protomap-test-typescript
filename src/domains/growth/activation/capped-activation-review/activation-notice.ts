import * as text from "../../../../kit/text.js";

/** Where a activation notice is in its life cycle. */
export type ActivationNoticeStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A activation notice. Its code is unique within a tenant. */
export class ActivationNotice {
  code: string;
  label: string;
  capacity: number;
  name: string;
  locale: string;
  version: number;
  updatedAt: number;
  sendAt: number;
  weight: number;
  impressions: number;
  unit: string;
  status: ActivationNoticeStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    name: string,
    locale: string,
    version: number,
    updatedAt: number,
    sendAt: number,
    weight: number,
    impressions: number,
    unit: string,
    status: ActivationNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.name = name;
    this.locale = locale;
    this.version = version;
    this.updatedAt = updatedAt;
    this.sendAt = sendAt;
    this.weight = weight;
    this.impressions = impressions;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ActivationNoticeStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ActivationNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedTotal(): number {
    return Math.round((this.version + this.updatedAt) * 100) / 100;
  }

  copy(): ActivationNotice {
    return new ActivationNotice(
      this.code,
      this.label,
      this.capacity,
      this.name,
      this.locale,
      this.version,
      this.updatedAt,
      this.sendAt,
      this.weight,
      this.impressions,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a activation notice in status proposed. */
export function newActivationNotice(code: string, label: string): ActivationNotice {
  return new ActivationNotice(code, label, 0, "", "", 0, 0, 0, 0, 0, "", "proposed");
}
