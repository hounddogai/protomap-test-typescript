import * as text from "../../../../kit/text.js";

/** Where a wait target is in its life cycle. */
export type WaitTargetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A wait target. Its code is unique within a tenant. */
export class WaitTarget {
  code: string;
  name: string;
  ratio: number;
  segment: string;
  phone: string;
  channel: string;
  archived: boolean;
  audienceId: string;
  label: string;
  description: string;
  status: WaitTargetStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    segment: string,
    phone: string,
    channel: string,
    archived: boolean,
    audienceId: string,
    label: string,
    description: string,
    status: WaitTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.segment = segment;
    this.phone = phone;
    this.channel = channel;
    this.archived = archived;
    this.audienceId = audienceId;
    this.label = label;
    this.description = description;
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

  canMoveTo(next: WaitTargetStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: WaitTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): WaitTarget {
    return new WaitTarget(
      this.code,
      this.name,
      this.ratio,
      this.segment,
      this.phone,
      this.channel,
      this.archived,
      this.audienceId,
      this.label,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a wait target in status open. */
export function newWaitTarget(code: string, name: string): WaitTarget {
  return new WaitTarget(code, name, 0, "", "", "", false, "", "", "", "open");
}
