import * as text from "../../../../kit/text.js";

/** Where a reputation baseline is in its life cycle. */
export type ReputationBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a reputation baseline and its current status. */
export class ReputationBaseline {
  code: string;
  title: string;
  visible: boolean;
  segment: string;
  quantity: number;
  windowDays: number;
  updatedAt: number;
  tags: string[];
  status: ReputationBaselineStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    segment: string,
    quantity: number,
    windowDays: number,
    updatedAt: number,
    tags: string[],
    status: ReputationBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.segment = segment;
    this.quantity = quantity;
    this.windowDays = windowDays;
    this.updatedAt = updatedAt;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReputationBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ReputationBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedTotal(): number {
    return Math.round(this.quantity * this.windowDays * 100) / 100;
  }

  copy(): ReputationBaseline {
    return new ReputationBaseline(
      this.code,
      this.title,
      this.visible,
      this.segment,
      this.quantity,
      this.windowDays,
      this.updatedAt,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a reputation baseline in status proposed. */
export function newReputationBaseline(code: string, title: string): ReputationBaseline {
  return new ReputationBaseline(code, title, false, "", 0, 0, 0, [], "proposed");
}
