import * as text from "../../../../kit/text.js";

/** Where a manual tier item is in its life cycle. */
export type ManualTierItemStatus = "created" | "validated" | "published" | "retired";

/** One manual tier item, with what the planners need to act on it. */
export class ManualTierItem {
  code: string;
  title: string;
  category: string;
  sequence: number;
  visible: boolean;
  conversionRate: number;
  status: ManualTierItemStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    sequence: number,
    visible: boolean,
    conversionRate: number,
    status: ManualTierItemStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.sequence = sequence;
    this.visible = visible;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: ManualTierItemStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualTierItemStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual tier item ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual tier item"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.conversionRate - this.sequence) * 100) / 100;
  }

  copy(): ManualTierItem {
    return new ManualTierItem(
      this.code,
      this.title,
      this.category,
      this.sequence,
      this.visible,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a manual tier item in status created. */
export function newManualTierItem(code: string, title: string): ManualTierItem {
  return new ManualTierItem(code, title, "", 0, false, 0, "created");
}
