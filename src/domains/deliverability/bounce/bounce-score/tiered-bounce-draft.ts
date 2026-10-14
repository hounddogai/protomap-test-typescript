import * as text from "../../../../kit/text.js";

/** Where a tiered bounce draft is in its life cycle. */
export type TieredBounceDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A tiered bounce draft. Its code is unique within a tenant. */
export class TieredBounceDraft {
  code: string;
  name: string;
  contactEmail: string;
  channel: string;
  source: string;
  score: number;
  status: TieredBounceDraftStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    channel: string,
    source: string,
    score: number,
    status: TieredBounceDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.channel = channel;
    this.source = source;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredBounceDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredBounceDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered bounce draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): TieredBounceDraft {
    return new TieredBounceDraft(
      this.code,
      this.name,
      this.contactEmail,
      this.channel,
      this.source,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered bounce draft in status idle. */
export function newTieredBounceDraft(code: string, name: string): TieredBounceDraft {
  return new TieredBounceDraft(code, name, "", "", "", 0, "idle");
}
