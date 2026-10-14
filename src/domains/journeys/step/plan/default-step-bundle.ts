import * as text from "../../../../kit/text.js";

/** Where a default step bundle is in its life cycle. */
export type DefaultStepBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A default step bundle. Its code is unique within a tenant. */
export class DefaultStepBundle {
  code: string;
  label: string;
  visible: boolean;
  sequence: number;
  capacity: number;
  margin: number;
  locale: string;
  createdAt: number;
  bid: number;
  amount: number;
  status: DefaultStepBundleStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    sequence: number,
    capacity: number,
    margin: number,
    locale: string,
    createdAt: number,
    bid: number,
    amount: number,
    status: DefaultStepBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.sequence = sequence;
    this.capacity = capacity;
    this.margin = margin;
    this.locale = locale;
    this.createdAt = createdAt;
    this.bid = bid;
    this.amount = amount;
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

  canMoveTo(next: DefaultStepBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DefaultStepBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default step bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedLoad(): number {
    return Math.round(this.sequence * this.bid * 100) / 100;
  }

  copy(): DefaultStepBundle {
    return new DefaultStepBundle(
      this.code,
      this.label,
      this.visible,
      this.sequence,
      this.capacity,
      this.margin,
      this.locale,
      this.createdAt,
      this.bid,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default step bundle in status draft. */
export function newDefaultStepBundle(code: string, label: string): DefaultStepBundle {
  return new DefaultStepBundle(code, label, false, 0, 0, 0, "", 0, 0, 0, "draft");
}
