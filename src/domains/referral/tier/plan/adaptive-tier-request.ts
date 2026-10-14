import * as text from "../../../../kit/text.js";

/** Where a adaptive tier request is in its life cycle. */
export type AdaptiveTierRequestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One adaptive tier request, with what the planners need to act on it. */
export class AdaptiveTierRequest {
  code: string;
  title: string;
  threshold: number;
  utmSource: string;
  updatedAt: number;
  phone: string;
  status: AdaptiveTierRequestStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    utmSource: string,
    updatedAt: number,
    phone: string,
    status: AdaptiveTierRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.utmSource = utmSource;
    this.updatedAt = updatedAt;
    this.phone = phone;
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

  canMoveTo(next: AdaptiveTierRequestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
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

  moveTo(next: AdaptiveTierRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive tier request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round((this.threshold - this.updatedAt) * 100) / 100;
  }

  copy(): AdaptiveTierRequest {
    return new AdaptiveTierRequest(
      this.code,
      this.title,
      this.threshold,
      this.utmSource,
      this.updatedAt,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a adaptive tier request in status planned. */
export function newAdaptiveTierRequest(code: string, title: string): AdaptiveTierRequest {
  return new AdaptiveTierRequest(code, title, 0, "", 0, "", "planned");
}
