import * as text from "../../../../kit/text.js";

/** Where a capped flight baseline is in its life cycle. */
export type CappedFlightBaselineStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A capped flight baseline. Its code is unique within a tenant. */
export class CappedFlightBaseline {
  code: string;
  title: string;
  updatedAt: number;
  name: string;
  visible: boolean;
  segment: string;
  discount: number;
  tags: string[];
  status: CappedFlightBaselineStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    name: string,
    visible: boolean,
    segment: string,
    discount: number,
    tags: string[],
    status: CappedFlightBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.name = name;
    this.visible = visible;
    this.segment = segment;
    this.discount = discount;
    this.tags = tags;
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

  canMoveTo(next: CappedFlightBaselineStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedFlightBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped flight baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedVolume(): number {
    return Math.round((this.updatedAt + this.discount) * 100) / 100;
  }

  copy(): CappedFlightBaseline {
    return new CappedFlightBaseline(
      this.code,
      this.title,
      this.updatedAt,
      this.name,
      this.visible,
      this.segment,
      this.discount,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a capped flight baseline in status draft. */
export function newCappedFlightBaseline(code: string, title: string): CappedFlightBaseline {
  return new CappedFlightBaseline(code, title, 0, "", false, "", 0, [], "draft");
}
