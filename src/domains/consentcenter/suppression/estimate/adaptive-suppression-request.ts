import * as text from "../../../../kit/text.js";

/** Where a adaptive suppression request is in its life cycle. */
export type AdaptiveSuppressionRequestStatus = "requested" | "granted" | "revoked" | "expired";

/** A adaptive suppression request. Its code is unique within a tenant. */
export class AdaptiveSuppressionRequest {
  code: string;
  title: string;
  description: string;
  contactEmail: string;
  windowDays: number;
  minimum: number;
  active: boolean;
  threshold: number;
  utmSource: string;
  attempts: number;
  sendAt: number;
  status: AdaptiveSuppressionRequestStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    contactEmail: string,
    windowDays: number,
    minimum: number,
    active: boolean,
    threshold: number,
    utmSource: string,
    attempts: number,
    sendAt: number,
    status: AdaptiveSuppressionRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.contactEmail = contactEmail;
    this.windowDays = windowDays;
    this.minimum = minimum;
    this.active = active;
    this.threshold = threshold;
    this.utmSource = utmSource;
    this.attempts = attempts;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveSuppressionRequestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveSuppressionRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive suppression request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netVolume(): number {
    return Math.round((this.attempts + this.sendAt) * 100) / 100;
  }

  copy(): AdaptiveSuppressionRequest {
    return new AdaptiveSuppressionRequest(
      this.code,
      this.title,
      this.description,
      this.contactEmail,
      this.windowDays,
      this.minimum,
      this.active,
      this.threshold,
      this.utmSource,
      this.attempts,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a adaptive suppression request in status requested. */
export function newAdaptiveSuppressionRequest(code: string, title: string): AdaptiveSuppressionRequest {
  return new AdaptiveSuppressionRequest(code, title, "", "", 0, 0, false, 0, "", 0, 0, "requested");
}
