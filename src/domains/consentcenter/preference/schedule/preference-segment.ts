import * as text from "../../../../kit/text.js";

/** Where a preference segment is in its life cycle. */
export type PreferenceSegmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A preference segment. Its code is unique within a tenant. */
export class PreferenceSegment {
  code: string;
  name: string;
  expiresAt: number;
  discount: number;
  utmSource: string;
  channel: string;
  archived: boolean;
  tags: string[];
  sendAt: number;
  windowDays: number;
  status: PreferenceSegmentStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    discount: number,
    utmSource: string,
    channel: string,
    archived: boolean,
    tags: string[],
    sendAt: number,
    windowDays: number,
    status: PreferenceSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.discount = discount;
    this.utmSource = utmSource;
    this.channel = channel;
    this.archived = archived;
    this.tags = tags;
    this.sendAt = sendAt;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PreferenceSegmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PreferenceSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round(this.sendAt * this.windowDays * 100) / 100;
  }

  copy(): PreferenceSegment {
    return new PreferenceSegment(
      this.code,
      this.name,
      this.expiresAt,
      this.discount,
      this.utmSource,
      this.channel,
      this.archived,
      this.tags,
      this.sendAt,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a preference segment in status proposed. */
export function newPreferenceSegment(code: string, name: string): PreferenceSegment {
  return new PreferenceSegment(code, name, 0, 0, "", "", false, [], 0, 0, "proposed");
}
