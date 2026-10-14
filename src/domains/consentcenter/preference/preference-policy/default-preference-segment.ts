import * as text from "../../../../kit/text.js";

/** Where a default preference segment is in its life cycle. */
export type DefaultPreferenceSegmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A default preference segment. Its code is unique within a tenant. */
export class DefaultPreferenceSegment {
  code: string;
  name: string;
  label: string;
  visible: boolean;
  amount: number;
  margin: number;
  threshold: number;
  pinned: boolean;
  audienceId: string;
  archived: boolean;
  status: DefaultPreferenceSegmentStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    visible: boolean,
    amount: number,
    margin: number,
    threshold: number,
    pinned: boolean,
    audienceId: string,
    archived: boolean,
    status: DefaultPreferenceSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.visible = visible;
    this.amount = amount;
    this.margin = margin;
    this.threshold = threshold;
    this.pinned = pinned;
    this.audienceId = audienceId;
    this.archived = archived;
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

  canMoveTo(next: DefaultPreferenceSegmentStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultPreferenceSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default preference segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round(this.amount * this.margin * 100) / 100;
  }

  copy(): DefaultPreferenceSegment {
    return new DefaultPreferenceSegment(
      this.code,
      this.name,
      this.label,
      this.visible,
      this.amount,
      this.margin,
      this.threshold,
      this.pinned,
      this.audienceId,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default preference segment in status draft. */
export function newDefaultPreferenceSegment(code: string, name: string): DefaultPreferenceSegment {
  return new DefaultPreferenceSegment(code, name, "", false, 0, 0, 0, false, "", false, "draft");
}
