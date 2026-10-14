import * as text from "../../../../kit/text.js";

/** Where a global redemption bundle is in its life cycle. */
export type GlobalRedemptionBundleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global redemption bundle as the redemption team keeps it. */
export class GlobalRedemptionBundle {
  code: string;
  label: string;
  channel: string;
  utmSource: string;
  startsAt: number;
  status: GlobalRedemptionBundleStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    utmSource: string,
    startsAt: number,
    status: GlobalRedemptionBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.utmSource = utmSource;
    this.startsAt = startsAt;
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

  canMoveTo(next: GlobalRedemptionBundleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalRedemptionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global redemption bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"global redemption bundle"} ${this.code}`;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): GlobalRedemptionBundle {
    return new GlobalRedemptionBundle(this.code, this.label, this.channel, this.utmSource, this.startsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a global redemption bundle in status planned. */
export function newGlobalRedemptionBundle(code: string, label: string): GlobalRedemptionBundle {
  return new GlobalRedemptionBundle(code, label, "", "", 0, "planned");
}
