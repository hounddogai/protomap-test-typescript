import * as text from "../../../../kit/text.js";

/** Where a sla bundle is in its life cycle. */
export type SlaBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A sla bundle. Its code is unique within a tenant. */
export class SlaBundle {
  code: string;
  title: string;
  budget: number;
  name: string;
  channel: string;
  startsAt: number;
  audienceId: string;
  label: string;
  unit: string;
  openRate: number;
  variant: string;
  status: SlaBundleStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    name: string,
    channel: string,
    startsAt: number,
    audienceId: string,
    label: string,
    unit: string,
    openRate: number,
    variant: string,
    status: SlaBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.name = name;
    this.channel = channel;
    this.startsAt = startsAt;
    this.audienceId = audienceId;
    this.label = label;
    this.unit = unit;
    this.openRate = openRate;
    this.variant = variant;
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

  canMoveTo(next: SlaBundleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round(this.openRate * this.startsAt * 100) / 100;
  }

  copy(): SlaBundle {
    return new SlaBundle(
      this.code,
      this.title,
      this.budget,
      this.name,
      this.channel,
      this.startsAt,
      this.audienceId,
      this.label,
      this.unit,
      this.openRate,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a sla bundle in status new. */
export function newSlaBundle(code: string, title: string): SlaBundle {
  return new SlaBundle(code, title, 0, "", "", 0, "", "", "", 0, "", "new");
}
