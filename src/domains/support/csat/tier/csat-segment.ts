import * as text from "../../../../kit/text.js";

/** Where a csat segment is in its life cycle. */
export type CsatSegmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One csat segment, with what the planners need to act on it. */
export class CsatSegment {
  code: string;
  name: string;
  title: string;
  active: boolean;
  currency: string;
  threshold: number;
  priority: number;
  variant: string;
  ratio: number;
  capacity: number;
  visible: boolean;
  status: CsatSegmentStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    active: boolean,
    currency: string,
    threshold: number,
    priority: number,
    variant: string,
    ratio: number,
    capacity: number,
    visible: boolean,
    status: CsatSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.active = active;
    this.currency = currency;
    this.threshold = threshold;
    this.priority = priority;
    this.variant = variant;
    this.ratio = ratio;
    this.capacity = capacity;
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

  canMoveTo(next: CsatSegmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CsatSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedExposure(): number {
    return Math.round(this.threshold * this.priority * 100) / 100;
  }

  copy(): CsatSegment {
    return new CsatSegment(
      this.code,
      this.name,
      this.title,
      this.active,
      this.currency,
      this.threshold,
      this.priority,
      this.variant,
      this.ratio,
      this.capacity,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a csat segment in status draft. */
export function newCsatSegment(code: string, name: string): CsatSegment {
  return new CsatSegment(code, name, "", false, "", 0, 0, "", 0, 0, false, "draft");
}
