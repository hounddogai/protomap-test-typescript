import * as text from "../../../../kit/text.js";

/** Where a preference request is in its life cycle. */
export type PreferenceRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a preference request and its current status. */
export class PreferenceRequest {
  code: string;
  name: string;
  minimum: number;
  locale: string;
  audienceId: string;
  unit: string;
  threshold: number;
  updatedAt: number;
  channel: string;
  status: PreferenceRequestStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    locale: string,
    audienceId: string,
    unit: string,
    threshold: number,
    updatedAt: number,
    channel: string,
    status: PreferenceRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.locale = locale;
    this.audienceId = audienceId;
    this.unit = unit;
    this.threshold = threshold;
    this.updatedAt = updatedAt;
    this.channel = channel;
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

  canMoveTo(next: PreferenceRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PreferenceRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedTotal(): number {
    return Math.round((this.minimum + this.threshold) * 100) / 100;
  }

  copy(): PreferenceRequest {
    return new PreferenceRequest(
      this.code,
      this.name,
      this.minimum,
      this.locale,
      this.audienceId,
      this.unit,
      this.threshold,
      this.updatedAt,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a preference request in status draft. */
export function newPreferenceRequest(code: string, name: string): PreferenceRequest {
  return new PreferenceRequest(code, name, 0, "", "", "", 0, 0, "", "draft");
}
