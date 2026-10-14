import * as text from "../../../../kit/text.js";

/** Where a creative threshold is in its life cycle. */
export type CreativeThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A creative threshold as the creative team keeps it. */
export class CreativeThreshold {
  code: string;
  title: string;
  locale: string;
  attempts: number;
  quantity: number;
  capacity: number;
  score: number;
  sendAt: number;
  visible: boolean;
  status: CreativeThresholdStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    attempts: number,
    quantity: number,
    capacity: number,
    score: number,
    sendAt: number,
    visible: boolean,
    status: CreativeThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.attempts = attempts;
    this.quantity = quantity;
    this.capacity = capacity;
    this.score = score;
    this.sendAt = sendAt;
    this.visible = visible;
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

  canMoveTo(next: CreativeThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CreativeThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"creative threshold"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.attempts + this.capacity) * 100) / 100;
  }

  copy(): CreativeThreshold {
    return new CreativeThreshold(
      this.code,
      this.title,
      this.locale,
      this.attempts,
      this.quantity,
      this.capacity,
      this.score,
      this.sendAt,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a creative threshold in status draft. */
export function newCreativeThreshold(code: string, title: string): CreativeThreshold {
  return new CreativeThreshold(code, title, "", 0, 0, 0, 0, 0, false, "draft");
}
