/**
 * The opt out score records of consentcenter's opt out work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a opt out score is in its life cycle. */
export type OptOutScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A opt out score. Its code is unique within a tenant. */
export class OptOutScore {
  code: string;
  name: string;
  region: string;
  title: string;
  batchSize: number;
  locale: string;
  clicks: number;
  endsAt: number;
  sendAt: number;
  country: string;
  status: OptOutScoreStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    title: string,
    batchSize: number,
    locale: string,
    clicks: number,
    endsAt: number,
    sendAt: number,
    country: string,
    status: OptOutScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.title = title;
    this.batchSize = batchSize;
    this.locale = locale;
    this.clicks = clicks;
    this.endsAt = endsAt;
    this.sendAt = sendAt;
    this.country = country;
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

  canMoveTo(next: OptOutScoreStatus): boolean {
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
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: OptOutScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveVolume(): number {
    return Math.round((this.batchSize - this.endsAt) * 100) / 100;
  }

  copy(): OptOutScore {
    return new OptOutScore(
      this.code,
      this.name,
      this.region,
      this.title,
      this.batchSize,
      this.locale,
      this.clicks,
      this.endsAt,
      this.sendAt,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a opt out score in status proposed. */
export function newOptOutScore(code: string, name: string): OptOutScore {
  return new OptOutScore(code, name, "", "", 0, "", 0, 0, 0, "", "proposed");
}
