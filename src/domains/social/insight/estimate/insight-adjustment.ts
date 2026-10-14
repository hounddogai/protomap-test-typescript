import * as text from "../../../../kit/text.js";

/** Where a insight adjustment is in its life cycle. */
export type InsightAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** A insight adjustment as the insight team keeps it. */
export class InsightAdjustment {
  code: string;
  title: string;
  minimum: number;
  threshold: number;
  notes: string;
  phone: string;
  channel: string;
  status: InsightAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    threshold: number,
    notes: string,
    phone: string,
    channel: string,
    status: InsightAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.threshold = threshold;
    this.notes = notes;
    this.phone = phone;
    this.channel = channel;
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

  canMoveTo(next: InsightAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: InsightAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"insight adjustment"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.threshold + this.minimum) * 100) / 100;
  }

  copy(): InsightAdjustment {
    return new InsightAdjustment(
      this.code,
      this.title,
      this.minimum,
      this.threshold,
      this.notes,
      this.phone,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a insight adjustment in status created. */
export function newInsightAdjustment(code: string, title: string): InsightAdjustment {
  return new InsightAdjustment(code, title, 0, 0, "", "", "", "created");
}
