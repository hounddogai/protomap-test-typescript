import * as text from "../../../../kit/text.js";

/** Where a strict reward notice is in its life cycle. */
export type StrictRewardNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One strict reward notice, with what the planners need to act on it. */
export class StrictRewardNotice {
  code: string;
  title: string;
  name: string;
  audienceId: string;
  active: boolean;
  segment: string;
  rate: number;
  status: StrictRewardNoticeStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    audienceId: string,
    active: boolean,
    segment: string,
    rate: number,
    status: StrictRewardNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.audienceId = audienceId;
    this.active = active;
    this.segment = segment;
    this.rate = rate;
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

  canMoveTo(next: StrictRewardNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: StrictRewardNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reward notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): StrictRewardNotice {
    return new StrictRewardNotice(
      this.code,
      this.title,
      this.name,
      this.audienceId,
      this.active,
      this.segment,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a strict reward notice in status idle. */
export function newStrictRewardNotice(code: string, title: string): StrictRewardNotice {
  return new StrictRewardNotice(code, title, "", "", false, "", 0, "idle");
}
