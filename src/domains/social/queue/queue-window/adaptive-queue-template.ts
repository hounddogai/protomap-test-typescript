import * as text from "../../../../kit/text.js";

/** Where a adaptive queue template is in its life cycle. */
export type AdaptiveQueueTemplateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A adaptive queue template as the queue team keeps it. */
export class AdaptiveQueueTemplate {
  code: string;
  label: string;
  channel: string;
  sendAt: number;
  clicks: number;
  budget: number;
  windowDays: number;
  status: AdaptiveQueueTemplateStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    sendAt: number,
    clicks: number,
    budget: number,
    windowDays: number,
    status: AdaptiveQueueTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.sendAt = sendAt;
    this.clicks = clicks;
    this.budget = budget;
    this.windowDays = windowDays;
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

  canMoveTo(next: AdaptiveQueueTemplateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveQueueTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive queue template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round((this.sendAt + this.budget) * 100) / 100;
  }

  copy(): AdaptiveQueueTemplate {
    return new AdaptiveQueueTemplate(
      this.code,
      this.label,
      this.channel,
      this.sendAt,
      this.clicks,
      this.budget,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive queue template in status planned. */
export function newAdaptiveQueueTemplate(code: string, label: string): AdaptiveQueueTemplate {
  return new AdaptiveQueueTemplate(code, label, "", 0, 0, 0, 0, "planned");
}
