import * as text from "../../../../kit/text.js";

/** Where a placement audit is in its life cycle. */
export type PlacementAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A placement audit. Its code is unique within a tenant. */
export class PlacementAudit {
  code: string;
  name: string;
  segment: string;
  ratio: number;
  amount: number;
  impressions: number;
  locale: string;
  weight: number;
  active: boolean;
  tags: string[];
  status: PlacementAuditStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    ratio: number,
    amount: number,
    impressions: number,
    locale: string,
    weight: number,
    active: boolean,
    tags: string[],
    status: PlacementAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.ratio = ratio;
    this.amount = amount;
    this.impressions = impressions;
    this.locale = locale;
    this.weight = weight;
    this.active = active;
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

  canMoveTo(next: PlacementAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PlacementAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"placement audit"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedLoad(): number {
    return Math.round((this.amount - this.weight) * 100) / 100;
  }

  copy(): PlacementAudit {
    return new PlacementAudit(
      this.code,
      this.name,
      this.segment,
      this.ratio,
      this.amount,
      this.impressions,
      this.locale,
      this.weight,
      this.active,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a placement audit in status draft. */
export function newPlacementAudit(code: string, name: string): PlacementAudit {
  return new PlacementAudit(code, name, "", 0, 0, 0, "", 0, false, [], "draft");
}
