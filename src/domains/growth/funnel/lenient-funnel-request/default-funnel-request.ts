/**
 * The default funnel request records of growth's funnel work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default funnel request is in its life cycle. */
export type DefaultFunnelRequestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a default funnel request and its current status. */
export class DefaultFunnelRequest {
  code: string;
  label: string;
  utmSource: string;
  minimum: number;
  startsAt: number;
  retries: number;
  externalRef: string;
  locale: string;
  durationMinutes: number;
  endsAt: number;
  weight: number;
  status: DefaultFunnelRequestStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    minimum: number,
    startsAt: number,
    retries: number,
    externalRef: string,
    locale: string,
    durationMinutes: number,
    endsAt: number,
    weight: number,
    status: DefaultFunnelRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.minimum = minimum;
    this.startsAt = startsAt;
    this.retries = retries;
    this.externalRef = externalRef;
    this.locale = locale;
    this.durationMinutes = durationMinutes;
    this.endsAt = endsAt;
    this.weight = weight;
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

  canMoveTo(next: DefaultFunnelRequestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultFunnelRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default funnel request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round(this.minimum * this.startsAt * 100) / 100;
  }

  copy(): DefaultFunnelRequest {
    return new DefaultFunnelRequest(
      this.code,
      this.label,
      this.utmSource,
      this.minimum,
      this.startsAt,
      this.retries,
      this.externalRef,
      this.locale,
      this.durationMinutes,
      this.endsAt,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a default funnel request in status proposed. */
export function newDefaultFunnelRequest(code: string, label: string): DefaultFunnelRequest {
  return new DefaultFunnelRequest(code, label, "", 0, 0, 0, "", "", 0, 0, 0, "proposed");
}
