import * as text from "../../../../kit/text.js";

/** Where a queue template is in its life cycle. */
export type QueueTemplateStatus = "created" | "validated" | "published" | "retired";

/** A queue template as the queue team keeps it. */
export class QueueTemplate {
  code: string;
  title: string;
  endsAt: number;
  floorValue: number;
  unit: string;
  visible: boolean;
  status: QueueTemplateStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    floorValue: number,
    unit: string,
    visible: boolean,
    status: QueueTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.floorValue = floorValue;
    this.unit = unit;
    this.visible = visible;
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

  canMoveTo(next: QueueTemplateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
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

  moveTo(next: QueueTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netTotal(): number {
    return Math.round((this.floorValue - this.endsAt) * 100) / 100;
  }

  copy(): QueueTemplate {
    return new QueueTemplate(this.code, this.title, this.endsAt, this.floorValue, this.unit, this.visible, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a queue template in status created. */
export function newQueueTemplate(code: string, title: string): QueueTemplate {
  return new QueueTemplate(code, title, 0, 0, "", false, "created");
}
