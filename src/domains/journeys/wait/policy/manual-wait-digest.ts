import * as text from "../../../../kit/text.js";

/** Where a manual wait digest is in its life cycle. */
export type ManualWaitDigestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One manual wait digest, with what the planners need to act on it. */
export class ManualWaitDigest {
  code: string;
  label: string;
  openRate: number;
  locale: string;
  durationMinutes: number;
  sequence: number;
  channel: string;
  status: ManualWaitDigestStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    locale: string,
    durationMinutes: number,
    sequence: number,
    channel: string,
    status: ManualWaitDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.locale = locale;
    this.durationMinutes = durationMinutes;
    this.sequence = sequence;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualWaitDigestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ManualWaitDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual wait digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.sequence - this.openRate) * 100) / 100;
  }

  copy(): ManualWaitDigest {
    return new ManualWaitDigest(
      this.code,
      this.label,
      this.openRate,
      this.locale,
      this.durationMinutes,
      this.sequence,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual wait digest in status draft. */
export function newManualWaitDigest(code: string, label: string): ManualWaitDigest {
  return new ManualWaitDigest(code, label, 0, "", 0, 0, "", "draft");
}
