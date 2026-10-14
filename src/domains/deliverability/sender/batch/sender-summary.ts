import * as text from "../../../../kit/text.js";

/** Where a sender summary is in its life cycle. */
export type SenderSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A sender summary as the sender team keeps it. */
export class SenderSummary {
  code: string;
  name: string;
  sendAt: number;
  revision: number;
  startsAt: number;
  title: string;
  campaignRef: string;
  status: SenderSummaryStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    revision: number,
    startsAt: number,
    title: string,
    campaignRef: string,
    status: SenderSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.revision = revision;
    this.startsAt = startsAt;
    this.title = title;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: SenderSummaryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedLoad(): number {
    return Math.round((this.sendAt + this.startsAt) * 100) / 100;
  }

  copy(): SenderSummary {
    return new SenderSummary(
      this.code,
      this.name,
      this.sendAt,
      this.revision,
      this.startsAt,
      this.title,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a sender summary in status open. */
export function newSenderSummary(code: string, name: string): SenderSummary {
  return new SenderSummary(code, name, 0, 0, 0, "", "", "open");
}
