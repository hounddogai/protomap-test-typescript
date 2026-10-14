import * as text from "../../../../kit/text.js";

/** Where a global escalation bundle is in its life cycle. */
export type GlobalEscalationBundleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global escalation bundle as the escalation team keeps it. */
export class GlobalEscalationBundle {
  code: string;
  label: string;
  tags: string[];
  weight: number;
  checksum: string;
  threshold: number;
  channel: string;
  archived: boolean;
  rate: number;
  title: string;
  campaignRef: string;
  status: GlobalEscalationBundleStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    weight: number,
    checksum: string,
    threshold: number,
    channel: string,
    archived: boolean,
    rate: number,
    title: string,
    campaignRef: string,
    status: GlobalEscalationBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.weight = weight;
    this.checksum = checksum;
    this.threshold = threshold;
    this.channel = channel;
    this.archived = archived;
    this.rate = rate;
    this.title = title;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: GlobalEscalationBundleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
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

  moveTo(next: GlobalEscalationBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global escalation bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedVolume(): number {
    return Math.round((this.rate + this.weight) * 100) / 100;
  }

  copy(): GlobalEscalationBundle {
    return new GlobalEscalationBundle(
      this.code,
      this.label,
      this.tags,
      this.weight,
      this.checksum,
      this.threshold,
      this.channel,
      this.archived,
      this.rate,
      this.title,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a global escalation bundle in status planned. */
export function newGlobalEscalationBundle(code: string, label: string): GlobalEscalationBundle {
  return new GlobalEscalationBundle(code, label, [], 0, "", 0, "", false, 0, "", "", "planned");
}
