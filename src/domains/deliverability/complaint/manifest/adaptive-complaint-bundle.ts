import * as text from "../../../../kit/text.js";

/** Where a adaptive complaint bundle is in its life cycle. */
export type AdaptiveComplaintBundleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a adaptive complaint bundle and its current status. */
export class AdaptiveComplaintBundle {
  code: string;
  name: string;
  campaignRef: string;
  conversionRate: number;
  channel: string;
  utmSource: string;
  windowDays: number;
  status: AdaptiveComplaintBundleStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    conversionRate: number,
    channel: string,
    utmSource: string,
    windowDays: number,
    status: AdaptiveComplaintBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.conversionRate = conversionRate;
    this.channel = channel;
    this.utmSource = utmSource;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveComplaintBundleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: AdaptiveComplaintBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive complaint bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive complaint bundle"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.conversionRate * this.windowDays * 100) / 100;
  }

  copy(): AdaptiveComplaintBundle {
    return new AdaptiveComplaintBundle(
      this.code,
      this.name,
      this.campaignRef,
      this.conversionRate,
      this.channel,
      this.utmSource,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive complaint bundle in status open. */
export function newAdaptiveComplaintBundle(code: string, name: string): AdaptiveComplaintBundle {
  return new AdaptiveComplaintBundle(code, name, "", 0, "", "", 0, "open");
}
