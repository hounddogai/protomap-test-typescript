import * as text from "../../../../kit/text.js";

/** Where a strict queue variance is in its life cycle. */
export type StrictQueueVarianceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a strict queue variance and its current status. */
export class StrictQueueVariance {
  code: string;
  name: string;
  visible: boolean;
  version: number;
  sendAt: number;
  rate: number;
  title: string;
  status: StrictQueueVarianceStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    version: number,
    sendAt: number,
    rate: number,
    title: string,
    status: StrictQueueVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.version = version;
    this.sendAt = sendAt;
    this.rate = rate;
    this.title = title;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictQueueVarianceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StrictQueueVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict queue variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedExposure(): number {
    return Math.round((this.version - this.rate) * 100) / 100;
  }

  copy(): StrictQueueVariance {
    return new StrictQueueVariance(
      this.code,
      this.name,
      this.visible,
      this.version,
      this.sendAt,
      this.rate,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict queue variance in status planned. */
export function newStrictQueueVariance(code: string, name: string): StrictQueueVariance {
  return new StrictQueueVariance(code, name, false, 0, 0, 0, "", "planned");
}
