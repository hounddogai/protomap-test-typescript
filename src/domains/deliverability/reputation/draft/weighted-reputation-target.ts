import * as text from "../../../../kit/text.js";

/** Where a weighted reputation target is in its life cycle. */
export type WeightedReputationTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One weighted reputation target, with what the planners need to act on it. */
export class WeightedReputationTarget {
  code: string;
  title: string;
  label: string;
  sendAt: number;
  locale: string;
  updatedAt: number;
  channel: string;
  source: string;
  approved: boolean;
  status: WeightedReputationTargetStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    sendAt: number,
    locale: string,
    updatedAt: number,
    channel: string,
    source: string,
    approved: boolean,
    status: WeightedReputationTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.sendAt = sendAt;
    this.locale = locale;
    this.updatedAt = updatedAt;
    this.channel = channel;
    this.source = source;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedReputationTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WeightedReputationTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reputation target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedVolume(): number {
    return Math.round((this.sendAt - this.updatedAt) * 100) / 100;
  }

  copy(): WeightedReputationTarget {
    return new WeightedReputationTarget(
      this.code,
      this.title,
      this.label,
      this.sendAt,
      this.locale,
      this.updatedAt,
      this.channel,
      this.source,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted reputation target in status draft. */
export function newWeightedReputationTarget(code: string, title: string): WeightedReputationTarget {
  return new WeightedReputationTarget(code, title, "", 0, "", 0, "", "", false, "draft");
}
