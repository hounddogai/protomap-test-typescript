import * as text from "../../../../kit/text.js";

/** Where a funnel notice is in its life cycle. */
export type FunnelNoticeStatus = "requested" | "granted" | "revoked" | "expired";

/** One funnel notice, with what the planners need to act on it. */
export class FunnelNotice {
  code: string;
  name: string;
  attributes: Map<string, string>;
  minimum: number;
  threshold: number;
  region: string;
  updatedAt: number;
  active: boolean;
  clicks: number;
  notes: string;
  status: FunnelNoticeStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    minimum: number,
    threshold: number,
    region: string,
    updatedAt: number,
    active: boolean,
    clicks: number,
    notes: string,
    status: FunnelNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.minimum = minimum;
    this.threshold = threshold;
    this.region = region;
    this.updatedAt = updatedAt;
    this.active = active;
    this.clicks = clicks;
    this.notes = notes;
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

  canMoveTo(next: FunnelNoticeStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FunnelNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"funnel notice"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveVolume(): number {
    return Math.round((this.updatedAt + this.minimum) * 100) / 100;
  }

  copy(): FunnelNotice {
    return new FunnelNotice(
      this.code,
      this.name,
      this.attributes,
      this.minimum,
      this.threshold,
      this.region,
      this.updatedAt,
      this.active,
      this.clicks,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a funnel notice in status requested. */
export function newFunnelNotice(code: string, name: string): FunnelNotice {
  return new FunnelNotice(code, name, new Map<string, string>(), 0, 0, "", 0, false, 0, "", "requested");
}
