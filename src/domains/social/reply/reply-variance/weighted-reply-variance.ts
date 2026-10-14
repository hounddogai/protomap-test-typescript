/**
 * The weighted reply variance records of social's reply work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted reply variance is in its life cycle. */
export type WeightedReplyVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A weighted reply variance as the reply team keeps it. */
export class WeightedReplyVariance {
  code: string;
  name: string;
  score: number;
  contactEmail: string;
  region: string;
  endsAt: number;
  description: string;
  phone: string;
  status: WeightedReplyVarianceStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    contactEmail: string,
    region: string,
    endsAt: number,
    description: string,
    phone: string,
    status: WeightedReplyVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.contactEmail = contactEmail;
    this.region = region;
    this.endsAt = endsAt;
    this.description = description;
    this.phone = phone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedReplyVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedReplyVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reply variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"weighted reply variance"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.score + this.endsAt) * 100) / 100;
  }

  copy(): WeightedReplyVariance {
    return new WeightedReplyVariance(
      this.code,
      this.name,
      this.score,
      this.contactEmail,
      this.region,
      this.endsAt,
      this.description,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a weighted reply variance in status idle. */
export function newWeightedReplyVariance(code: string, name: string): WeightedReplyVariance {
  return new WeightedReplyVariance(code, name, 0, "", "", 0, "", "", "idle");
}
