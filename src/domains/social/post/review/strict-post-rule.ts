import * as text from "../../../../kit/text.js";

/** Where a strict post rule is in its life cycle. */
export type StrictPostRuleStatus = "created" | "validated" | "published" | "retired";

/** A strict post rule as the post team keeps it. */
export class StrictPostRule {
  code: string;
  title: string;
  floorValue: number;
  sendAt: number;
  label: string;
  attempts: number;
  ownerId: string;
  discount: number;
  summary: string;
  endsAt: number;
  audienceId: string;
  status: StrictPostRuleStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    sendAt: number,
    label: string,
    attempts: number,
    ownerId: string,
    discount: number,
    summary: string,
    endsAt: number,
    audienceId: string,
    status: StrictPostRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.sendAt = sendAt;
    this.label = label;
    this.attempts = attempts;
    this.ownerId = ownerId;
    this.discount = discount;
    this.summary = summary;
    this.endsAt = endsAt;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictPostRuleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: StrictPostRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict post rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveVolume(): number {
    return Math.round(this.discount * this.floorValue * 100) / 100;
  }

  copy(): StrictPostRule {
    return new StrictPostRule(
      this.code,
      this.title,
      this.floorValue,
      this.sendAt,
      this.label,
      this.attempts,
      this.ownerId,
      this.discount,
      this.summary,
      this.endsAt,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict post rule in status created. */
export function newStrictPostRule(code: string, title: string): StrictPostRule {
  return new StrictPostRule(code, title, 0, 0, "", 0, "", 0, "", 0, "", "created");
}
