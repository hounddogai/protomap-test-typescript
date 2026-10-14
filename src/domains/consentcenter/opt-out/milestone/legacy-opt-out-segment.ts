import * as text from "../../../../kit/text.js";

/** Where a legacy opt out segment is in its life cycle. */
export type LegacyOptOutSegmentStatus = "created" | "validated" | "published" | "retired";

/** A legacy opt out segment. Its code is unique within a tenant. */
export class LegacyOptOutSegment {
  code: string;
  label: string;
  maximum: number;
  timezone: string;
  visible: boolean;
  sendAt: number;
  region: string;
  phone: string;
  locale: string;
  channel: string;
  revision: number;
  status: LegacyOptOutSegmentStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    timezone: string,
    visible: boolean,
    sendAt: number,
    region: string,
    phone: string,
    locale: string,
    channel: string,
    revision: number,
    status: LegacyOptOutSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.timezone = timezone;
    this.visible = visible;
    this.sendAt = sendAt;
    this.region = region;
    this.phone = phone;
    this.locale = locale;
    this.channel = channel;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyOptOutSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyOptOutSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy opt out segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"legacy opt out segment"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.sendAt + this.revision) * 100) / 100;
  }

  copy(): LegacyOptOutSegment {
    return new LegacyOptOutSegment(
      this.code,
      this.label,
      this.maximum,
      this.timezone,
      this.visible,
      this.sendAt,
      this.region,
      this.phone,
      this.locale,
      this.channel,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a legacy opt out segment in status created. */
export function newLegacyOptOutSegment(code: string, label: string): LegacyOptOutSegment {
  return new LegacyOptOutSegment(code, label, 0, "", false, 0, "", "", "", "", 0, "created");
}
