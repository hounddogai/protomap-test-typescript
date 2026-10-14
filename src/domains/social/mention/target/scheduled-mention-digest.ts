import * as text from "../../../../kit/text.js";

/** Where a scheduled mention digest is in its life cycle. */
export type ScheduledMentionDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A scheduled mention digest. Its code is unique within a tenant. */
export class ScheduledMentionDigest {
  code: string;
  label: string;
  title: string;
  campaignRef: string;
  visible: boolean;
  attempts: number;
  pinned: boolean;
  threshold: number;
  description: string;
  cost: number;
  status: ScheduledMentionDigestStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    campaignRef: string,
    visible: boolean,
    attempts: number,
    pinned: boolean,
    threshold: number,
    description: string,
    cost: number,
    status: ScheduledMentionDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.campaignRef = campaignRef;
    this.visible = visible;
    this.attempts = attempts;
    this.pinned = pinned;
    this.threshold = threshold;
    this.description = description;
    this.cost = cost;
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

  canMoveTo(next: ScheduledMentionDigestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledMentionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled mention digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedVolume(): number {
    return Math.round(this.attempts * this.threshold * 100) / 100;
  }

  copy(): ScheduledMentionDigest {
    return new ScheduledMentionDigest(
      this.code,
      this.label,
      this.title,
      this.campaignRef,
      this.visible,
      this.attempts,
      this.pinned,
      this.threshold,
      this.description,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled mention digest in status open. */
export function newScheduledMentionDigest(code: string, label: string): ScheduledMentionDigest {
  return new ScheduledMentionDigest(code, label, "", "", false, 0, false, 0, "", 0, "open");
}
