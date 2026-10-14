import * as text from "../../../../kit/text.js";

/** Where a touchpoint quota is in its life cycle. */
export type TouchpointQuotaStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A touchpoint quota. Its code is unique within a tenant. */
export class TouchpointQuota {
  code: string;
  name: string;
  priority: number;
  archived: boolean;
  maximum: number;
  phone: string;
  ratio: number;
  tags: string[];
  conversionRate: number;
  score: number;
  category: string;
  status: TouchpointQuotaStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    archived: boolean,
    maximum: number,
    phone: string,
    ratio: number,
    tags: string[],
    conversionRate: number,
    score: number,
    category: string,
    status: TouchpointQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.archived = archived;
    this.maximum = maximum;
    this.phone = phone;
    this.ratio = ratio;
    this.tags = tags;
    this.conversionRate = conversionRate;
    this.score = score;
    this.category = category;
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

  canMoveTo(next: TouchpointQuotaStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
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
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round(this.priority * this.conversionRate * 100) / 100;
  }

  copy(): TouchpointQuota {
    return new TouchpointQuota(
      this.code,
      this.name,
      this.priority,
      this.archived,
      this.maximum,
      this.phone,
      this.ratio,
      this.tags,
      this.conversionRate,
      this.score,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a touchpoint quota in status draft. */
export function newTouchpointQuota(code: string, name: string): TouchpointQuota {
  return new TouchpointQuota(code, name, 0, false, 0, "", 0, [], 0, 0, "", "draft");
}
