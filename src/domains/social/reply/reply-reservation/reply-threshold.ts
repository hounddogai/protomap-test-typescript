import * as text from "../../../../kit/text.js";

/** Where a reply threshold is in its life cycle. */
export type ReplyThresholdStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a reply threshold and its current status. */
export class ReplyThreshold {
  code: string;
  name: string;
  utmSource: string;
  source: string;
  retries: number;
  openRate: number;
  category: string;
  locale: string;
  frequencyCap: number;
  tags: string[];
  channel: string;
  status: ReplyThresholdStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    source: string,
    retries: number,
    openRate: number,
    category: string,
    locale: string,
    frequencyCap: number,
    tags: string[],
    channel: string,
    status: ReplyThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.source = source;
    this.retries = retries;
    this.openRate = openRate;
    this.category = category;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.tags = tags;
    this.channel = channel;
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

  canMoveTo(next: ReplyThresholdStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
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
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ReplyThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
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

  projectedVolume(): number {
    return Math.round(this.openRate * this.frequencyCap * 100) / 100;
  }

  copy(): ReplyThreshold {
    return new ReplyThreshold(
      this.code,
      this.name,
      this.utmSource,
      this.source,
      this.retries,
      this.openRate,
      this.category,
      this.locale,
      this.frequencyCap,
      this.tags,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a reply threshold in status open. */
export function newReplyThreshold(code: string, name: string): ReplyThreshold {
  return new ReplyThreshold(code, name, "", "", 0, 0, "", "", 0, [], "", "open");
}
