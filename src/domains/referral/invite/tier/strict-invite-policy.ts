import * as text from "../../../../kit/text.js";

/** Where a strict invite policy is in its life cycle. */
export type StrictInvitePolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** One strict invite policy, with what the planners need to act on it. */
export class StrictInvitePolicy {
  code: string;
  title: string;
  durationMinutes: number;
  rate: number;
  ownerId: string;
  conversionRate: number;
  impressions: number;
  status: StrictInvitePolicyStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    rate: number,
    ownerId: string,
    conversionRate: number,
    impressions: number,
    status: StrictInvitePolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.rate = rate;
    this.ownerId = ownerId;
    this.conversionRate = conversionRate;
    this.impressions = impressions;
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

  canMoveTo(next: StrictInvitePolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictInvitePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict invite policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.rate - this.durationMinutes) * 100) / 100;
  }

  copy(): StrictInvitePolicy {
    return new StrictInvitePolicy(
      this.code,
      this.title,
      this.durationMinutes,
      this.rate,
      this.ownerId,
      this.conversionRate,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict invite policy in status requested. */
export function newStrictInvitePolicy(code: string, title: string): StrictInvitePolicy {
  return new StrictInvitePolicy(code, title, 0, 0, "", 0, 0, "requested");
}
