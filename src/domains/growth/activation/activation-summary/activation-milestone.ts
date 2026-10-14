import * as text from "../../../../kit/text.js";

/** Where a activation milestone is in its life cycle. */
export type ActivationMilestoneStatus = "new" | "queued" | "running" | "done" | "failed";

/** One activation milestone, with what the planners need to act on it. */
export class ActivationMilestone {
  code: string;
  name: string;
  batchSize: number;
  channel: string;
  tags: string[];
  ratio: number;
  sendAt: number;
  contactEmail: string;
  status: ActivationMilestoneStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    channel: string,
    tags: string[],
    ratio: number,
    sendAt: number,
    contactEmail: string,
    status: ActivationMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.channel = channel;
    this.tags = tags;
    this.ratio = ratio;
    this.sendAt = sendAt;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: ActivationMilestoneStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ActivationMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round((this.sendAt + this.ratio) * 100) / 100;
  }

  copy(): ActivationMilestone {
    return new ActivationMilestone(
      this.code,
      this.name,
      this.batchSize,
      this.channel,
      this.tags,
      this.ratio,
      this.sendAt,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a activation milestone in status new. */
export function newActivationMilestone(code: string, name: string): ActivationMilestone {
  return new ActivationMilestone(code, name, 0, "", [], 0, 0, "", "new");
}
