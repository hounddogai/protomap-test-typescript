import * as text from "../../../../kit/text.js";

/** Where a path window is in its life cycle. */
export type PathWindowStatus = "requested" | "granted" | "revoked" | "expired";

/** One path window, with what the planners need to act on it. */
export class PathWindow {
  code: string;
  title: string;
  conversionRate: number;
  sendAt: number;
  pinned: boolean;
  rate: number;
  expiresAt: number;
  tags: string[];
  status: PathWindowStatus;

  constructor(
    code: string,
    title: string,
    conversionRate: number,
    sendAt: number,
    pinned: boolean,
    rate: number,
    expiresAt: number,
    tags: string[],
    status: PathWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRate = conversionRate;
    this.sendAt = sendAt;
    this.pinned = pinned;
    this.rate = rate;
    this.expiresAt = expiresAt;
    this.tags = tags;
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

  canMoveTo(next: PathWindowStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PathWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"path window"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedVolume(): number {
    return Math.round((this.rate - this.expiresAt) * 100) / 100;
  }

  copy(): PathWindow {
    return new PathWindow(
      this.code,
      this.title,
      this.conversionRate,
      this.sendAt,
      this.pinned,
      this.rate,
      this.expiresAt,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a path window in status requested. */
export function newPathWindow(code: string, title: string): PathWindow {
  return new PathWindow(code, title, 0, 0, false, 0, 0, [], "requested");
}
