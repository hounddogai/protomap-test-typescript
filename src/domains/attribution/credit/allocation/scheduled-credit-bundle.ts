import * as text from "../../../../kit/text.js";

/** Where a scheduled credit bundle is in its life cycle. */
export type ScheduledCreditBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A scheduled credit bundle. Its code is unique within a tenant. */
export class ScheduledCreditBundle {
  code: string;
  title: string;
  createdAt: number;
  contactEmail: string;
  utmSource: string;
  sendAt: number;
  priority: number;
  budget: number;
  clicks: number;
  status: ScheduledCreditBundleStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    contactEmail: string,
    utmSource: string,
    sendAt: number,
    priority: number,
    budget: number,
    clicks: number,
    status: ScheduledCreditBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.contactEmail = contactEmail;
    this.utmSource = utmSource;
    this.sendAt = sendAt;
    this.priority = priority;
    this.budget = budget;
    this.clicks = clicks;
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

  canMoveTo(next: ScheduledCreditBundleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ScheduledCreditBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled credit bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled credit bundle"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.priority + this.clicks) * 100) / 100;
  }

  copy(): ScheduledCreditBundle {
    return new ScheduledCreditBundle(
      this.code,
      this.title,
      this.createdAt,
      this.contactEmail,
      this.utmSource,
      this.sendAt,
      this.priority,
      this.budget,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a scheduled credit bundle in status new. */
export function newScheduledCreditBundle(code: string, title: string): ScheduledCreditBundle {
  return new ScheduledCreditBundle(code, title, 0, "", "", 0, 0, 0, 0, "new");
}
