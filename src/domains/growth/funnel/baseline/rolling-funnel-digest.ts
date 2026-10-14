import * as text from "../../../../kit/text.js";

/** Where a rolling funnel digest is in its life cycle. */
export type RollingFunnelDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a rolling funnel digest and its current status. */
export class RollingFunnelDigest {
  code: string;
  title: string;
  sendAt: number;
  durationMinutes: number;
  locale: string;
  rate: number;
  summary: string;
  status: RollingFunnelDigestStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    durationMinutes: number,
    locale: string,
    rate: number,
    summary: string,
    status: RollingFunnelDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.durationMinutes = durationMinutes;
    this.locale = locale;
    this.rate = rate;
    this.summary = summary;
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

  canMoveTo(next: RollingFunnelDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RollingFunnelDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling funnel digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedLoad(): number {
    return Math.round(this.sendAt * this.durationMinutes * 100) / 100;
  }

  copy(): RollingFunnelDigest {
    return new RollingFunnelDigest(
      this.code,
      this.title,
      this.sendAt,
      this.durationMinutes,
      this.locale,
      this.rate,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling funnel digest in status planned. */
export function newRollingFunnelDigest(code: string, title: string): RollingFunnelDigest {
  return new RollingFunnelDigest(code, title, 0, 0, "", 0, "", "planned");
}
