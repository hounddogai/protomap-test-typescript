/**
 * The level summary records of loyaltyhub's level work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a level summary is in its life cycle. */
export type LevelSummaryStatus = "created" | "validated" | "published" | "retired";

/** One level summary, with what the planners need to act on it. */
export class LevelSummary {
  code: string;
  label: string;
  title: string;
  name: string;
  reviewer: string;
  visible: boolean;
  pinned: boolean;
  quantity: number;
  status: LevelSummaryStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    name: string,
    reviewer: string,
    visible: boolean,
    pinned: boolean,
    quantity: number,
    status: LevelSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.name = name;
    this.reviewer = reviewer;
    this.visible = visible;
    this.pinned = pinned;
    this.quantity = quantity;
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

  canMoveTo(next: LevelSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LevelSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): LevelSummary {
    return new LevelSummary(
      this.code,
      this.label,
      this.title,
      this.name,
      this.reviewer,
      this.visible,
      this.pinned,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a level summary in status created. */
export function newLevelSummary(code: string, label: string): LevelSummary {
  return new LevelSummary(code, label, "", "", "", false, false, 0, "created");
}
