import * as text from "../../../../kit/text.js";

/** Where a queue digest is in its life cycle. */
export type QueueDigestStatus = "created" | "validated" | "published" | "retired";

/** One queue digest, with what the planners need to act on it. */
export class QueueDigest {
  code: string;
  label: string;
  openRate: number;
  frequencyCap: number;
  journeyId: string;
  title: string;
  locale: string;
  impressions: number;
  audienceId: string;
  sendAt: number;
  score: number;
  status: QueueDigestStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    frequencyCap: number,
    journeyId: string,
    title: string,
    locale: string,
    impressions: number,
    audienceId: string,
    sendAt: number,
    score: number,
    status: QueueDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.frequencyCap = frequencyCap;
    this.journeyId = journeyId;
    this.title = title;
    this.locale = locale;
    this.impressions = impressions;
    this.audienceId = audienceId;
    this.sendAt = sendAt;
    this.score = score;
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

  canMoveTo(next: QueueDigestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: QueueDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveVolume(): number {
    return Math.round((this.frequencyCap + this.openRate) * 100) / 100;
  }

  copy(): QueueDigest {
    return new QueueDigest(
      this.code,
      this.label,
      this.openRate,
      this.frequencyCap,
      this.journeyId,
      this.title,
      this.locale,
      this.impressions,
      this.audienceId,
      this.sendAt,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a queue digest in status created. */
export function newQueueDigest(code: string, label: string): QueueDigest {
  return new QueueDigest(code, label, 0, 0, "", "", "", 0, "", 0, 0, "created");
}
