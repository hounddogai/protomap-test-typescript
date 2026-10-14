import * as text from "../../../../kit/text.js";

/** Where a fallback nudge notice is in its life cycle. */
export type FallbackNudgeNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A fallback nudge notice. Its code is unique within a tenant. */
export class FallbackNudgeNotice {
  code: string;
  title: string;
  segment: string;
  unit: string;
  margin: number;
  impressions: number;
  phone: string;
  status: FallbackNudgeNoticeStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    unit: string,
    margin: number,
    impressions: number,
    phone: string,
    status: FallbackNudgeNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.unit = unit;
    this.margin = margin;
    this.impressions = impressions;
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

  canMoveTo(next: FallbackNudgeNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
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
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackNudgeNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback nudge notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round(this.margin * this.impressions * 100) / 100;
  }

  copy(): FallbackNudgeNotice {
    return new FallbackNudgeNotice(
      this.code,
      this.title,
      this.segment,
      this.unit,
      this.margin,
      this.impressions,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fallback nudge notice in status idle. */
export function newFallbackNudgeNotice(code: string, title: string): FallbackNudgeNotice {
  return new FallbackNudgeNotice(code, title, "", "", 0, 0, "", "idle");
}
