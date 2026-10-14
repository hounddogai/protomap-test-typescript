import * as text from "../../../../kit/text.js";

/** Where a reply bundle is in its life cycle. */
export type ReplyBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One reply bundle, with what the planners need to act on it. */
export class ReplyBundle {
  code: string;
  label: string;
  margin: number;
  version: number;
  retries: number;
  audienceId: string;
  tags: string[];
  ceiling: number;
  region: string;
  title: string;
  status: ReplyBundleStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    version: number,
    retries: number,
    audienceId: string,
    tags: string[],
    ceiling: number,
    region: string,
    title: string,
    status: ReplyBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.version = version;
    this.retries = retries;
    this.audienceId = audienceId;
    this.tags = tags;
    this.ceiling = ceiling;
    this.region = region;
    this.title = title;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReplyBundleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        return next === "failed";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReplyBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedExposure(): number {
    return Math.round((this.margin + this.ceiling) * 100) / 100;
  }

  copy(): ReplyBundle {
    return new ReplyBundle(
      this.code,
      this.label,
      this.margin,
      this.version,
      this.retries,
      this.audienceId,
      this.tags,
      this.ceiling,
      this.region,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a reply bundle in status new. */
export function newReplyBundle(code: string, label: string): ReplyBundle {
  return new ReplyBundle(code, label, 0, 0, 0, "", [], 0, "", "", "new");
}
