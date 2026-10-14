import * as text from "../../../../kit/text.js";

/** Where a adaptive bounce group is in its life cycle. */
export type AdaptiveBounceGroupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A adaptive bounce group. Its code is unique within a tenant. */
export class AdaptiveBounceGroup {
  code: string;
  title: string;
  audienceId: string;
  channel: string;
  archived: boolean;
  active: boolean;
  clicks: number;
  campaignRef: string;
  region: string;
  status: AdaptiveBounceGroupStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    channel: string,
    archived: boolean,
    active: boolean,
    clicks: number,
    campaignRef: string,
    region: string,
    status: AdaptiveBounceGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.channel = channel;
    this.archived = archived;
    this.active = active;
    this.clicks = clicks;
    this.campaignRef = campaignRef;
    this.region = region;
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

  canMoveTo(next: AdaptiveBounceGroupStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: AdaptiveBounceGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive bounce group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.clicks;
  }

  copy(): AdaptiveBounceGroup {
    return new AdaptiveBounceGroup(
      this.code,
      this.title,
      this.audienceId,
      this.channel,
      this.archived,
      this.active,
      this.clicks,
      this.campaignRef,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive bounce group in status idle. */
export function newAdaptiveBounceGroup(code: string, title: string): AdaptiveBounceGroup {
  return new AdaptiveBounceGroup(code, title, "", "", false, false, 0, "", "", "idle");
}
