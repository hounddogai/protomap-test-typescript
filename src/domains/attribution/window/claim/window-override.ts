import * as text from "../../../../kit/text.js";

/** Where a window override is in its life cycle. */
export type WindowOverrideStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One window override, with what the planners need to act on it. */
export class WindowOverride {
  code: string;
  title: string;
  limit: number;
  sendAt: number;
  updatedAt: number;
  campaignRef: string;
  journeyId: string;
  ratio: number;
  expiresAt: number;
  status: WindowOverrideStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    sendAt: number,
    updatedAt: number,
    campaignRef: string,
    journeyId: string,
    ratio: number,
    expiresAt: number,
    status: WindowOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.sendAt = sendAt;
    this.updatedAt = updatedAt;
    this.campaignRef = campaignRef;
    this.journeyId = journeyId;
    this.ratio = ratio;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: WindowOverrideStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedTotal(): number {
    return Math.round((this.updatedAt + this.ratio) * 100) / 100;
  }

  copy(): WindowOverride {
    return new WindowOverride(
      this.code,
      this.title,
      this.limit,
      this.sendAt,
      this.updatedAt,
      this.campaignRef,
      this.journeyId,
      this.ratio,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a window override in status open. */
export function newWindowOverride(code: string, title: string): WindowOverride {
  return new WindowOverride(code, title, 0, 0, 0, "", "", 0, 0, "open");
}
