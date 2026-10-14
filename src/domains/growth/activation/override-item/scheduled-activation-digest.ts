import * as text from "../../../../kit/text.js";

/** Where a scheduled activation digest is in its life cycle. */
export type ScheduledActivationDigestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One scheduled activation digest, with what the planners need to act on it. */
export class ScheduledActivationDigest {
  code: string;
  name: string;
  campaignRef: string;
  impressions: number;
  variant: string;
  rate: number;
  status: ScheduledActivationDigestStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    impressions: number,
    variant: string,
    rate: number,
    status: ScheduledActivationDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.impressions = impressions;
    this.variant = variant;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledActivationDigestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledActivationDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled activation digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.impressions - this.rate) * 100) / 100;
  }

  copy(): ScheduledActivationDigest {
    return new ScheduledActivationDigest(
      this.code,
      this.name,
      this.campaignRef,
      this.impressions,
      this.variant,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled activation digest in status new. */
export function newScheduledActivationDigest(code: string, name: string): ScheduledActivationDigest {
  return new ScheduledActivationDigest(code, name, "", 0, "", 0, "new");
}
